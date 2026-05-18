import { apiError, apiSuccess, parseJsonBody } from "@/lib/api";
import { requireUser, requireWorkspace } from "@/lib/api-auth";
import { prisma, ClipStatus } from "@clipforge/database";
import { approveClipSchema } from "@clipforge/shared";

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
  const parsed = approveClipSchema.safeParse(body);
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

  const updated = await prisma.clipCandidate.update({
    where: { id },
    data: { status: ClipStatus.approved },
  });

  return apiSuccess(updated);
};
