import { apiError, apiSuccess } from "@/lib/api";
import { requireUser, requireWorkspace } from "@/lib/api-auth";
import { prisma } from "@clipforge/database";

export const GET = async (
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  const authResult = await requireUser();
  if ("error" in authResult) {
    return authResult.error;
  }

  const { id } = await params;
  const source = await prisma.sourceVideo.findUnique({
    where: { id },
  });

  if (source === null) {
    return apiError("NOT_FOUND", "Source not found", 404);
  }

  const access = await requireWorkspace(authResult.userId, source.workspaceId);
  if ("error" in access) {
    return access.error;
  }

  return apiSuccess(source);
};
