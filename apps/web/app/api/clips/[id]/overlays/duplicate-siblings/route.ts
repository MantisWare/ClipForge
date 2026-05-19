import { apiError, apiSuccess, parseJsonBody } from "@/lib/api";
import {
  requireUser,
  requireWorkspaceEditor,
} from "@/lib/api-auth";
import { loadClipForWorkspace, requireApprovedClip } from "@/lib/clip-access";
import { isOverlaysEnabled, overlaysDisabledResponse } from "@/lib/overlay-feature";
import { ClipStatus, prisma, type Prisma } from "@clipforge/database";
import { z } from "zod";

const bodySchema = z.object({
  workspaceId: z.string().min(1),
});

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
  const parsed = bodySchema.safeParse(body);
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

  const statusError = requireApprovedClip(loaded.clip.status);
  if (statusError !== null) {
    return statusError;
  }

  const sourceOverlays = await prisma.clipOverlay.findMany({
    where: { clipCandidateId: id, isDraft: false },
    orderBy: [{ sortOrder: "asc" }, { startMs: "asc" }],
  });

  if (sourceOverlays.length === 0) {
    return apiError("VALIDATION_ERROR", "No overlays to duplicate", 400);
  }

  const siblings = await prisma.clipCandidate.findMany({
    where: {
      sourceVideoId: loaded.clip.sourceVideoId,
      id: { not: id },
      status: { in: [ClipStatus.approved, ClipStatus.rendered] },
    },
    select: { id: true },
  });

  let duplicatedCount = 0;

  await prisma.$transaction(async (tx) => {
    for (const sibling of siblings) {
      const previous = await tx.clipOverlay.findMany({
        where: { clipCandidateId: sibling.id },
      });
      if (previous.length > 0) {
        await tx.clipOverlayRevision.create({
          data: {
            clipCandidateId: sibling.id,
            snapshot: previous as unknown as Prisma.InputJsonValue,
          },
        });
        await tx.clipOverlay.deleteMany({
          where: { clipCandidateId: sibling.id },
        });
      }

      const siblingClip = await tx.clipCandidate.findUnique({
        where: { id: sibling.id },
      });
      if (siblingClip === null) {
        continue;
      }

      const durationMs = siblingClip.endMs - siblingClip.startMs;

      for (const [index, overlay] of sourceOverlays.entries()) {
        const startMs = Math.min(overlay.startMs, durationMs);
        const endMs = Math.min(overlay.endMs, durationMs);
        if (endMs <= startMs) {
          continue;
        }

        await tx.clipOverlay.create({
          data: {
            clipCandidateId: sibling.id,
            overlayType: overlay.overlayType,
            templateId: overlay.templateId,
            productLinkId: overlay.productLinkId,
            startMs,
            endMs,
            position: overlay.position as Prisma.InputJsonValue,
            style: overlay.style as Prisma.InputJsonValue,
            compliance: overlay.compliance,
            sortOrder: overlay.sortOrder ?? index,
            isDraft: false,
          },
        });
      }
      duplicatedCount += 1;
    }
  });

  return apiSuccess({
    siblingCount: siblings.length,
    duplicatedCount,
    overlayCount: sourceOverlays.length,
  });
};
