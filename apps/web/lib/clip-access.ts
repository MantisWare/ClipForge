import { apiError } from "@/lib/api";
import { prisma, ClipStatus } from "@clipforge/database";

export const loadClipForWorkspace = async (clipId: string) => {
  const clip = await prisma.clipCandidate.findUnique({
    where: { id: clipId },
    include: { sourceVideo: true },
  });
  if (clip === null) {
    return { error: apiError("NOT_FOUND", "Clip not found", 404) as Response };
  }
  return { clip, workspaceId: clip.sourceVideo.workspaceId };
};

export const requireApprovedClip = (status: ClipStatus) => {
  if (status !== ClipStatus.approved && status !== ClipStatus.rendered) {
    return apiError(
      "VALIDATION_ERROR",
      "Overlays require an approved or rendered clip",
      400,
    );
  }
  return null;
};
