import { apiError, apiSuccess, parseJsonBody } from "@/lib/api";
import { requireUser, requireWorkspaceEditor } from "@/lib/api-auth";
import { loadClipForWorkspace } from "@/lib/clip-access";
import { isOverlaysEnabled, overlaysDisabledResponse } from "@/lib/overlay-feature";
import { prisma, ClipStatus, type Prisma } from "@clipforge/database";
import { attachOverlayPackSchema } from "@clipforge/shared";

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

  const { id } = await params;
  const body = await parseJsonBody<unknown>(request);
  const parsed = attachOverlayPackSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", parsed.error.message, 400);
  }

  const loaded = await loadClipForWorkspace(id);
  if ("error" in loaded) {
    return loaded.error;
  }

  const access = await requireWorkspaceEditor(
    authResult.userId,
    parsed.data.workspaceId,
  );
  if ("error" in access) {
    return access.error;
  }

  if (loaded.workspaceId !== parsed.data.workspaceId) {
    return apiError("FORBIDDEN", "Clip not in workspace", 403);
  }

  if (
    loaded.clip.status !== ClipStatus.approved &&
    loaded.clip.status !== ClipStatus.rendered
  ) {
    return apiError(
      "VALIDATION_ERROR",
      "Clip must be approved or rendered",
      400,
    );
  }

  const templates = await prisma.overlayTemplate.findMany({
    where: {
      id: { in: parsed.data.templateIds },
      workspaceId: parsed.data.workspaceId,
    },
  });

  if (templates.length === 0) {
    return apiError("NOT_FOUND", "No templates found", 404);
  }

  const clipDurationMs = loaded.clip.endMs - loaded.clip.startMs;
  const created = await prisma.$transaction(async (tx) => {
    const rows = [];
    for (const [index, template] of templates.entries()) {
      const config =
        typeof template.config === "object" && template.config !== null
          ? (template.config as Record<string, unknown>)
          : {};
      const durationMs =
        typeof config.durationMs === "number" ? config.durationMs : 3000;
      const startMs = Math.max(0, clipDurationMs - durationMs);
      const row = await tx.clipOverlay.create({
        data: {
          clipCandidateId: id,
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
      rows.push(row);
    }
    return rows;
  });

  return apiSuccess(created, 201);
};
