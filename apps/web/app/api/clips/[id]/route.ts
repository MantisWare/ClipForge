import { apiError, apiSuccess, parseJsonBody } from "@/lib/api";
import { requireUser, requireWorkspace, requireWorkspaceEditor } from "@/lib/api-auth";
import { prisma } from "@clipforge/database";
import { updateClipSchema } from "@clipforge/shared";

export const GET = async (
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  const authResult = await requireUser();
  if ("error" in authResult) {
    return authResult.error;
  }

  const { id } = await params;
  const clip = await prisma.clipCandidate.findUnique({
    where: { id },
    include: { sourceVideo: true },
  });

  if (clip === null) {
    return apiError("NOT_FOUND", "Clip not found", 404);
  }

  const access = await requireWorkspace(
    authResult.userId,
    clip.sourceVideo.workspaceId,
  );
  if ("error" in access) {
    return access.error;
  }

  return apiSuccess(clip);
};

export const PATCH = async (
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  const authResult = await requireUser();
  if ("error" in authResult) {
    return authResult.error;
  }

  const { id } = await params;
  const body = await parseJsonBody<unknown>(request);
  const parsed = updateClipSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", parsed.error.message, 400, parsed.error.flatten());
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

  if (clip.sourceVideo.workspaceId !== parsed.data.workspaceId) {
    return apiError("FORBIDDEN", "Clip not in workspace", 403);
  }

  let startMs = clip.startMs;
  let endMs = clip.endMs;
  if (parsed.data.startMs !== undefined) {
    startMs = parsed.data.startMs;
  }
  if (parsed.data.endMs !== undefined) {
    endMs = parsed.data.endMs;
  }
  if (endMs <= startMs) {
    return apiError("VALIDATION_ERROR", "endMs must be greater than startMs", 400);
  }

  const updated = await prisma.clipCandidate.update({
    where: { id },
    data: {
      suggestedHook: parsed.data.suggestedHook ?? clip.suggestedHook,
      suggestedTitle: parsed.data.suggestedTitle ?? clip.suggestedTitle,
      suggestedCaption: parsed.data.suggestedCaption ?? clip.suggestedCaption,
      suggestedHashtags:
        parsed.data.suggestedHashtags ?? clip.suggestedHashtags,
      startMs,
      endMs,
      durationSeconds: (endMs - startMs) / 1000,
    },
  });

  return apiSuccess(updated);
};
