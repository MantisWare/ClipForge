import { apiError, apiSuccess, parseJsonBody } from "@/lib/api";
import { requireUser, requireWorkspaceEditor } from "@/lib/api-auth";
import { isOverlaysEnabled, overlaysDisabledResponse } from "@/lib/overlay-feature";
import { prisma, ClipStatus, type Prisma } from "@clipforge/database";
import { applyOverlayPackSchema } from "@clipforge/shared";

export const POST = async (
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  if (!isOverlaysEnabled()) {
    return overlaysDisabledResponse();
  }

  const authResult = await requireUser();
  if ("error" in authResult) {
    return authResult.error;
  }

  const { id: sourceVideoId } = await params;
  const body = await parseJsonBody<unknown>(request);
  const parsed = applyOverlayPackSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", parsed.error.message, 400);
  }

  const source = await prisma.sourceVideo.findUnique({
    where: { id: sourceVideoId },
  });
  if (source === null) {
    return apiError("NOT_FOUND", "Source not found", 404);
  }

  const access = await requireWorkspaceEditor(
    authResult.userId,
    parsed.data.workspaceId,
  );
  if ("error" in access) {
    return access.error;
  }

  if (source.workspaceId !== parsed.data.workspaceId) {
    return apiError("FORBIDDEN", "Source not in workspace", 403);
  }

  const templates = await prisma.overlayTemplate.findMany({
    where: {
      id: { in: parsed.data.templateIds },
      workspaceId: parsed.data.workspaceId,
    },
  });

  const clips = await prisma.clipCandidate.findMany({
    where: {
      id: { in: parsed.data.clipCandidateIds },
      sourceVideoId,
      status: { in: [ClipStatus.approved, ClipStatus.rendered] },
    },
  });

  let createdCount = 0;

  for (const clip of clips) {
    const clipDurationMs = clip.endMs - clip.startMs;
    for (const [index, template] of templates.entries()) {
      const config =
        typeof template.config === "object" && template.config !== null
          ? (template.config as Record<string, unknown>)
          : {};
      const durationMs =
        typeof config.durationMs === "number" ? config.durationMs : 3000;
      const startMs = Math.max(0, clipDurationMs - durationMs);
      await prisma.clipOverlay.create({
        data: {
          clipCandidateId: clip.id,
          overlayType: template.overlayType,
          templateId: template.id,
          startMs,
          endMs: clipDurationMs,
          position: { anchor: "bottom_right", marginPx: 80 } as Prisma.InputJsonValue,
          style: config as Prisma.InputJsonValue,
          compliance:
            template.overlayType === "affiliate_bar" ||
            template.overlayType === "product_pin"
              ? "affiliate"
              : template.overlayType === "sponsor_segment"
                ? "sponsored"
                : "none",
          sortOrder: index,
        },
      });
      createdCount += 1;
    }
  }

  return apiSuccess({ createdCount, clipCount: clips.length });
};
