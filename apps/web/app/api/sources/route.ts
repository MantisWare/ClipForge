import { apiError, apiSuccess } from "@/lib/api";
import { requireUser, requireWorkspace } from "@/lib/api-auth";
import { prisma } from "@clipforge/database";

export const GET = async (request: Request) => {
  const authResult = await requireUser();
  if ("error" in authResult) {
    return authResult.error;
  }

  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId");
  if (workspaceId === null || workspaceId === "") {
    return apiError("VALIDATION_ERROR", "workspaceId is required", 400);
  }

  const access = await requireWorkspace(authResult.userId, workspaceId);
  if ("error" in access) {
    return access.error;
  }

  const sources = await prisma.sourceVideo.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return apiSuccess(sources);
};
