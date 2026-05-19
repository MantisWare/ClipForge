import { apiError, apiSuccess, parseJsonBody } from "@/lib/api";
import { requireUser, requireWorkspaceEditor } from "@/lib/api-auth";
import { buildDisclosureBlock, requiresDisclosure } from "@/lib/overlay-compliance";
import { assertRenderQuota } from "@/lib/quotas";
import { enqueueJob } from "@/lib/queue";
import { validateProductUrls } from "@/lib/url-safety";
import { prisma, ClipStatus, RenderStatus } from "@clipforge/database";
import { renderClipSchema, scoreOverlayDensity } from "@clipforge/shared";

export const POST = async (
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  const authResult = await requireUser();
  if ("error" in authResult) {
    return authResult.error;
  }

  const { id } = await params;
  const body = await parseJsonBody<unknown>(request);
  const parsed = renderClipSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", parsed.error.message, 400);
  }

  const clip = await prisma.clipCandidate.findUnique({
    where: { id },
    include: { sourceVideo: true },
  });
  if (clip === null) {
    return apiError("NOT_FOUND", "Clip not found", 404);
  }

  const access = await requireWorkspaceEditor(
    authResult.userId,
    parsed.data.workspaceId,
  );
  if ("error" in access) {
    return access.error;
  }

  const quota = await assertRenderQuota(parsed.data.workspaceId);
  if ("error" in quota) {
    return quota.error;
  }

  if (
    clip.status !== ClipStatus.approved &&
    clip.status !== ClipStatus.rendered
  ) {
    return apiError(
      "VALIDATION_ERROR",
      "Only approved or previously rendered clips can be rendered",
      400,
    );
  }

  const overlays = await prisma.clipOverlay.findMany({
    where: { clipCandidateId: clip.id, isDraft: false },
    include: { productLink: true },
  });

  if (parsed.data.includeOverlays === true && overlays.length === 0) {
    return apiError(
      "VALIDATION_ERROR",
      "No confirmed overlays to burn in. Add overlays or render without includeOverlays.",
      400,
    );
  }

  const settings = await prisma.workspaceOverlaySettings.findUnique({
    where: { workspaceId: parsed.data.workspaceId },
  });

  if (
    requiresDisclosure(overlays) &&
    settings?.requireDisclosureOnExport === true
  ) {
    const disclosure = buildDisclosureBlock({
      defaultDisclosureText: settings.defaultDisclosureText,
      overlays,
      productDisclosures: overlays
        .map((o) => o.productLink?.disclosureText)
        .filter((d): d is string => d !== null && d !== undefined && d !== ""),
    });
    if (disclosure === null) {
      return apiError(
        "VALIDATION_ERROR",
        "Affiliate or sponsored overlays require workspace disclosure text",
        400,
      );
    }
  }

  const productUrls = overlays
    .map((o) => o.productLink?.url)
    .filter((u): u is string => u !== undefined && u !== "");
  const urlChecks = validateProductUrls(
    productUrls,
    settings?.urlAllowlist ?? [],
  );
  const badUrl = urlChecks.find((c) => !c.ok);
  if (badUrl !== undefined && !badUrl.ok) {
    return apiError("VALIDATION_ERROR", badUrl.reason, 400);
  }

  const density = scoreOverlayDensity(
    overlays.map((o) => ({
      startMs: o.startMs,
      endMs: o.endMs,
      position:
        typeof o.position === "object" && o.position !== null
          ? (o.position as { anchor?: string; marginPx?: number })
          : undefined,
    })),
  );

  const rendered = await prisma.renderedClip.create({
    data: {
      clipCandidateId: clip.id,
      workspaceId: parsed.data.workspaceId,
      renderPreset: parsed.data.renderPreset,
      captionStyleId: parsed.data.captionStyleId,
      brandKitId: parsed.data.brandKitId,
      status: RenderStatus.queued,
    },
  });

  const job = await enqueueJob({
    workspaceId: parsed.data.workspaceId,
    type: "render.clip",
    sourceVideoId: clip.sourceVideoId,
    payload: {
      renderedClipId: rendered.id,
      clipCandidateId: clip.id,
      workspaceId: parsed.data.workspaceId,
      includeOverlays: parsed.data.includeOverlays,
      brandKitId: parsed.data.brandKitId,
    },
  });

  return apiSuccess({ rendered, job, overlayWarnings: density.warnings }, 202);
};
