import {
  buildRenderedStorageKey,
  generateAssSubtitles,
  getImportConfig,
  getRenderConfig,
  hexToDrawtextColor,
} from "@clipforge/shared";
import {
  downloadFileFromS3,
  uploadFileToS3,
} from "@clipforge/shared/server";
import { enqueueFromWorker } from "../lib/enqueue-from-worker.js";
import type { AssStyleTemplate } from "@clipforge/shared";
import { ClipStatus, prisma, RenderStatus } from "@clipforge/database";
import ffmpeg from "fluent-ffmpeg";
import { writeFile } from "node:fs/promises";
import { mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { fireRenderWebhook } from "../lib/render-webhook.js";

export type RenderClipPayload = {
  renderedClipId: string;
  clipCandidateId: string;
  workspaceId: string;
  includeOverlays?: boolean;
  brandKitId?: string;
};

const escapeDrawtext = (text: string): string =>
  text
    .replace(/\\/g, "\\\\")
    .replace(/:/g, "\\:")
    .replace(/'/g, "'\\''")
    .replace(/%/g, "\\%");

const runFfmpeg = (
  inputPath: string,
  outputPath: string,
  assPath: string | null,
  hookText: string | null,
  hookDurationSec: number,
  hookFontSize: number,
  hookColor: string,
): Promise<void> => {
  const config = getRenderConfig();

  return new Promise((resolve, reject) => {
    let command = ffmpeg(inputPath)
      .setStartTime(0)
      .videoFilters([
        `scale=${config.outputWidth}:${config.outputHeight}:force_original_aspect_ratio=increase`,
        `crop=${config.outputWidth}:${config.outputHeight}`,
      ])
      .fps(config.outputFps)
      .videoCodec("libx264")
      .audioCodec("aac")
      .outputOptions(["-pix_fmt yuv420p", "-movflags +faststart"]);

    const filters: string[] = [];
    if (assPath !== null) {
      filters.push(`subtitles=${assPath.replace(/:/g, "\\:")}`);
    }
    if (hookText !== null && hookText !== "") {
      const escaped = escapeDrawtext(hookText);
      filters.push(
        `drawtext=text='${escaped}':fontsize=${hookFontSize}:fontcolor=${hookColor}:borderw=3:bordercolor=black:x=(w-text_w)/2:y=${config.safeMarginTop}:enable='between(t,0,${hookDurationSec})'`,
      );
    }
    if (filters.length > 0) {
      command = command.videoFilters([
        `scale=${config.outputWidth}:${config.outputHeight}:force_original_aspect_ratio=increase`,
        `crop=${config.outputWidth}:${config.outputHeight}`,
        ...filters,
      ]);
    }

    command
      .on("end", () => resolve())
      .on("error", (err) => reject(err))
      .save(outputPath);
  });
};

const runFfmpegToFile = (
  inputPath: string,
  outputPath: string,
  configure: (command: ffmpeg.FfmpegCommand) => ffmpeg.FfmpegCommand,
): Promise<void> =>
  new Promise((resolve, reject) => {
    configure(ffmpeg(inputPath))
      .on("end", () => resolve())
      .on("error", (err) => reject(err))
      .save(outputPath);
  });

const trimSource = async (
  inputPath: string,
  outputPath: string,
  startSec: number,
  endSec: number,
): Promise<void> => {
  const duration = endSec - startSec;
  try {
    await runFfmpegToFile(inputPath, outputPath, (command) =>
      command
        .setStartTime(startSec)
        .setDuration(duration)
        .outputOptions(["-c", "copy"]),
    );
  } catch {
    await runFfmpegToFile(inputPath, outputPath, (command) =>
      command
        .setStartTime(startSec)
        .setDuration(duration)
        .videoCodec("libx264")
        .audioCodec("aac"),
    );
  }
};

export const runRenderClip = async (payload: RenderClipPayload): Promise<void> => {
  const {
    renderedClipId,
    clipCandidateId,
    workspaceId,
    includeOverlays = false,
    brandKitId,
  } = payload;
  const importConfig = getImportConfig();
  const renderConfig = getRenderConfig();

  const rendered = await prisma.renderedClip.findUnique({
    where: { id: renderedClipId },
    include: {
      captionStyle: true,
      clipCandidate: {
        include: {
          sourceVideo: {
            include: {
              transcriptSegments: {
                include: { words: { orderBy: { startMs: "asc" } } },
              },
            },
          },
        },
      },
    },
  });

  if (rendered === null) {
    throw new Error(`Rendered clip not found: ${renderedClipId}`);
  }

  const clip = rendered.clipCandidate;
  const source = clip.sourceVideo;

  let captionPreset = rendered.captionStyle;
  if (captionPreset === null) {
    captionPreset = await prisma.captionStylePreset.findFirst({
      where: { workspaceId, isDefault: true },
    });
  }

  const brandKit = await prisma.brandKit.findFirst({
    where: { workspaceId, isDefault: true },
  });

  const assOverrides =
    captionPreset?.assTemplate !== undefined &&
    typeof captionPreset.assTemplate === "object" &&
    captionPreset.assTemplate !== null
      ? (captionPreset.assTemplate as AssStyleTemplate)
      : undefined;

  const hookFontSize = brandKit?.hookFontSize ?? 56;
  const hookColor = hexToDrawtextColor(brandKit?.primaryColor ?? "#FFFFFF");

  if (source.storageKey === null) {
    throw new Error("Source video missing storageKey");
  }

  await prisma.renderedClip.update({
    where: { id: renderedClipId },
    data: { status: RenderStatus.rendering },
  });

  const workDir = join(importConfig.tempDir, "render", renderedClipId);
  await mkdir(workDir, { recursive: true });

  const sourcePath = join(workDir, "source.mp4");
  const trimmedPath = join(workDir, "trimmed.mp4");
  const assPath = join(workDir, "captions.ass");
  const outputPath = join(workDir, "clean.mp4");
  const cleanStorageKey = buildRenderedStorageKey(
    workspaceId,
    renderedClipId,
    "clean.mp4",
  );
  const playbackStorageKey = buildRenderedStorageKey(
    workspaceId,
    renderedClipId,
    "output.mp4",
  );

  try {
    await downloadFileFromS3(
      source.storageKey,
      sourcePath,
      getImportConfig().maxSourceBytes,
    );

    const startSec = clip.startMs / 1000;
    const endSec = clip.endMs / 1000;
    await trimSource(sourcePath, trimmedPath, startSec, endSec);

    const words = source.transcriptSegments.flatMap((seg) =>
      seg.words.filter(
        (w) => w.startMs >= clip.startMs && w.endMs <= clip.endMs,
      ),
    );

    const assContent = generateAssSubtitles(
      words.map((w) => ({
        word: w.word,
        startMs: w.startMs,
        endMs: w.endMs,
      })),
      clip.startMs,
      assOverrides,
    );
    await writeFile(assPath, assContent, "utf8");

    const hookText =
      clip.suggestedHook ??
      clip.transcriptExcerpt.split(".")[0]?.trim() ??
      null;
    const hookDurationSec = renderConfig.hookDurationMs / 1000;

    await runFfmpeg(
      trimmedPath,
      outputPath,
      assPath,
      hookText,
      hookDurationSec,
      hookFontSize,
      hookColor,
    );

    await uploadFileToS3(cleanStorageKey, outputPath, "video/mp4");

    const overlayCount = await prisma.clipOverlay.count({
      where: { clipCandidateId, isDraft: false },
    });

    const needsOverlayPass =
      includeOverlays === true || overlayCount > 0;

    if (needsOverlayPass) {
      await prisma.renderedClip.update({
        where: { id: renderedClipId },
        data: {
          cleanStorageKey,
          brandKitId: brandKitId ?? brandKit?.id ?? null,
          status: RenderStatus.rendering,
          width: renderConfig.outputWidth,
          height: renderConfig.outputHeight,
          durationSeconds: clip.durationSeconds,
        },
      });

      await enqueueFromWorker({
        workspaceId,
        type: "render.apply_overlays",
        sourceVideoId: source.id,
        payload: {
          renderedClipId,
          clipCandidateId,
          workspaceId,
        },
      });
    } else {
      await uploadFileToS3(playbackStorageKey, outputPath, "video/mp4");

      await prisma.$transaction([
        prisma.renderedClip.update({
          where: { id: renderedClipId },
          data: {
            storageKey: playbackStorageKey,
            cleanStorageKey,
            status: RenderStatus.ready,
            width: renderConfig.outputWidth,
            height: renderConfig.outputHeight,
            durationSeconds: clip.durationSeconds,
            outputUrl: null,
          },
        }),
        prisma.clipCandidate.update({
          where: { id: clipCandidateId },
          data: { status: ClipStatus.rendered },
        }),
      ]);
      await fireRenderWebhook(workspaceId, renderedClipId, "clean");
    }
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
