import { apiError, apiSuccess, parseJsonBody } from "@/lib/api";
import { requireUser, requireWorkspace } from "@/lib/api-auth";
import { enqueueJob } from "@/lib/queue";
import { prisma, ClipStatus, RenderStatus } from "@clipforge/database";
import { renderClipSchema } from "@clipforge/shared";

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

  const access = await requireWorkspace(
    authResult.userId,
    parsed.data.workspaceId,
  );
  if ("error" in access) {
    return access.error;
  }

  const rendered = await prisma.renderedClip.create({
    data: {
      clipCandidateId: clip.id,
      workspaceId: parsed.data.workspaceId,
      renderPreset: parsed.data.renderPreset,
      captionStyleId: parsed.data.captionStyleId,
      status: RenderStatus.queued,
    },
  });

  const job = await enqueueJob({
    workspaceId: parsed.data.workspaceId,
    type: "render.clip",
    sourceVideoId: clip.sourceVideoId,
    payload: { renderedClipId: rendered.id, clipCandidateId: clip.id },
  });

  await prisma.clipCandidate.update({
    where: { id },
    data: { status: ClipStatus.rendered },
  });

  return apiSuccess({ rendered, job }, 202);
};
