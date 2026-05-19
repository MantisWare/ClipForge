import {
  buildRenderedStorageKey,
  getImportConfig,
  getRenderConfig,
  getSignedDownloadUrl,
  hexToDrawtextColor,
  uploadFileToS3,
  type OverlaysManifest,
} from "@clipforge/shared";
import { ClipStatus, prisma, RenderStatus, RenderVariant } from "@clipforge/database";
import { writeFile } from "node:fs/promises";
import { mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { basename } from "node:path";
import { downloadDirectUrl } from "../import/direct-url.js";
import { mapClipOverlaysToRenderItems } from "./overlay-assets.js";
import {
  buildOverlayDrawtextFilters,
  runOverlayFfmpeg,
} from "./overlay-ffmpeg.js";

export type ApplyOverlaysPayload = {
  renderedClipId: string;
  clipCandidateId: string;
  workspaceId: string;
};

const fireRenderWebhook = async (
  workspaceId: string,
  renderedClipId: string,
) => {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { renderWebhookUrl: true },
  });
  const url = workspace?.renderWebhookUrl;
  if (url === null || url === undefined || url === "") {
    return;
  }
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "render.complete",
        renderedClipId,
        workspaceId,
        variant: "monetized",
      }),
    });
  } catch {
    /* webhook is best-effort */
  }
};

export const runApplyOverlays = async (
  payload: ApplyOverlaysPayload,
): Promise<void> => {
  const { renderedClipId, clipCandidateId, workspaceId } = payload;
  const importConfig = getImportConfig();
  const renderConfig = getRenderConfig();

  const rendered = await prisma.renderedClip.findUnique({
    where: { id: renderedClipId },
    include: {
      clipCandidate: {
        include: {
          clipOverlays: {
            where: { isDraft: false },
            include: { productLink: true },
            orderBy: [{ sortOrder: "asc" }, { startMs: "asc" }],
          },
        },
      },
    },
  });

  if (rendered === null) {
    throw new Error(`Rendered clip not found: ${renderedClipId}`);
  }

  const cleanKey =
    rendered.cleanStorageKey ??
    buildRenderedStorageKey(workspaceId, renderedClipId, "clean.mp4");

  if (rendered.clipCandidate.clipOverlays.length === 0) {
    await prisma.$transaction([
      prisma.renderedClip.update({
        where: { id: renderedClipId },
        data: {
          storageKey: cleanKey,
          status: RenderStatus.ready,
          renderVariant: RenderVariant.clean,
        },
      }),
      prisma.clipCandidate.update({
        where: { id: clipCandidateId },
        data: { status: ClipStatus.rendered },
      }),
    ]);
    return;
  }

  const brandKit =
    rendered.brandKitId !== null
      ? await prisma.brandKit.findUnique({ where: { id: rendered.brandKitId } })
      : await prisma.brandKit.findFirst({
          where: { workspaceId, isDefault: true },
        });

  const hookFontSize = brandKit?.hookFontSize ?? 56;
  const hookColor = hexToDrawtextColor(brandKit?.primaryColor ?? "#FFFFFF");

  const workDir = join(importConfig.tempDir, "overlay", renderedClipId);
  await mkdir(workDir, { recursive: true });

  const inputPath = join(workDir, "clean.mp4");
  const outputPath = join(workDir, "output.mp4");
  const manifestPath = join(workDir, "overlays.json");

  const outputKey = buildRenderedStorageKey(
    workspaceId,
    renderedClipId,
    "output.mp4",
  );
  const manifestKey = buildRenderedStorageKey(
    workspaceId,
    renderedClipId,
    "overlays.json",
  );

  try {
    const signedUrl = await getSignedDownloadUrl(cleanKey, 3600);
    await downloadDirectUrl(signedUrl, workDir, "clean.mp4");

    const imagePathByOverlayId = new Map<string, string>();
    for (const overlay of rendered.clipCandidate.clipOverlays) {
      const storageKey = overlay.productLink?.imageStorageKey;
      if (storageKey === null || storageKey === undefined || storageKey === "") {
        continue;
      }
      const signedUrl = await getSignedDownloadUrl(storageKey, 3600);
      const ext = basename(storageKey).includes(".")
        ? basename(storageKey).slice(basename(storageKey).lastIndexOf("."))
        : ".jpg";
      const filename = `product-${overlay.id}${ext}`;
      await downloadDirectUrl(signedUrl, workDir, filename);
      imagePathByOverlayId.set(overlay.id, join(workDir, filename));
    }

    const renderItems = mapClipOverlaysToRenderItems(
      rendered.clipCandidate.clipOverlays,
    ).map((item) => {
      const localImage = imagePathByOverlayId.get(item.id);
      if (localImage === undefined) {
        return item;
      }
      return {
        ...item,
        assets: { ...item.assets, imagePath: localImage },
      };
    });

    const { drawtextFilters, imageOverlays } = buildOverlayDrawtextFilters(
      renderItems,
      0,
      hookFontSize,
      hookColor,
    );

    await runOverlayFfmpeg(
      inputPath,
      outputPath,
      drawtextFilters,
      imageOverlays,
    );

    const manifest: OverlaysManifest = {
      renderedClipId,
      clipCandidateId,
      workspaceId,
      overlays: renderItems.map((item) => ({
        id: item.id,
        type: item.type,
        startMs: item.startMs,
        endMs: item.endMs,
        compliance: item.compliance,
      })),
      generatedAt: new Date().toISOString(),
    };

    await writeFile(manifestPath, JSON.stringify(manifest, null, 2), "utf8");

    await uploadFileToS3(outputKey, outputPath, "video/mp4");
    await uploadFileToS3(manifestKey, manifestPath, "application/json");

    for (const overlay of rendered.clipCandidate.clipOverlays) {
      if (
        overlay.productLinkId !== null &&
        overlay.productLink !== null
      ) {
        const slug = `o${overlay.id.replace(/-/g, "").slice(0, 12)}`;
        await prisma.overlayLinkSlug.upsert({
          where: { slug },
          create: {
            slug,
            workspaceId,
            productLinkId: overlay.productLinkId,
            renderedClipId,
            clipOverlayId: overlay.id,
            targetUrl: overlay.productLink.url,
          },
          update: {
            targetUrl: overlay.productLink.url,
            renderedClipId,
          },
        });
        const slugRow = await prisma.overlayLinkSlug.findUnique({
          where: { slug },
        });
        if (slugRow !== null) {
          await prisma.overlayEvent.create({
            data: {
              slugId: slugRow.id,
              type: "impression",
            },
          });
        }
      }
    }

    await prisma.$transaction([
      prisma.renderedClip.update({
        where: { id: renderedClipId },
        data: {
          storageKey: outputKey,
          cleanStorageKey: cleanKey,
          overlaysManifestKey: manifestKey,
          status: RenderStatus.ready,
          renderVariant: RenderVariant.monetized,
          width: renderConfig.outputWidth,
          height: renderConfig.outputHeight,
        },
      }),
      prisma.clipCandidate.update({
        where: { id: clipCandidateId },
        data: { status: ClipStatus.rendered },
      }),
    ]);

    await fireRenderWebhook(workspaceId, renderedClipId);
  } catch (error) {
    await prisma.renderedClip.update({
      where: { id: renderedClipId },
      data: { status: RenderStatus.failed },
    });
    throw error;
  } finally {
    await rm(workDir, { recursive: true, force: true }).catch(() => undefined);
  }
};
