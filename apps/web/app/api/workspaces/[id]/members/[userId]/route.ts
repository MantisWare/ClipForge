import { apiError, apiSuccess, parseJsonBody } from "@/lib/api";
import { requireUser } from "@/lib/api-auth";
import { requireWorkspaceRole } from "@/lib/workspace";
import { prisma } from "@clipforge/database";
import { updateMemberRoleSchema } from "@clipforge/shared";

export const PATCH = async (
  request: Request,
  {
    params,
  }: { params: Promise<{ id: string; userId: string }> },
) => {
  const authResult = await requireUser();
  if ("error" in authResult) {
    return authResult.error;
  }

  const { id: workspaceId, userId: targetUserId } = await params;
  const canEdit = await requireWorkspaceRole(
    authResult.userId,
    workspaceId,
    "admin",
  );
  if (!canEdit) {
    return apiError("FORBIDDEN", "Admin role required", 403);
  }

  const body = await parseJsonBody<unknown>(request);
  const parsed = updateMemberRoleSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", parsed.error.message, 400);
  }

  const member = await prisma.workspaceMember.update({
    where: {
      workspaceId_userId: { workspaceId, userId: targetUserId },
    },
    data: { role: parsed.data.role },
    include: {
      user: { select: { id: true, email: true, name: true } },
    },
  });

  return apiSuccess(member);
};

export const DELETE = async (
  _request: Request,
  {
    params,
  }: { params: Promise<{ id: string; userId: string }> },
) => {
  const authResult = await requireUser();
  if ("error" in authResult) {
    return authResult.error;
  }

  const { id: workspaceId, userId: targetUserId } = await params;

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
  });
  if (workspace === null) {
    return apiError("NOT_FOUND", "Workspace not found", 404);
  }

  if (workspace.ownerId === targetUserId) {
    return apiError("VALIDATION_ERROR", "Cannot remove workspace owner", 400);
  }

  const canRemove = await requireWorkspaceRole(
    authResult.userId,
    workspaceId,
    "admin",
  );
  if (!canRemove) {
    return apiError("FORBIDDEN", "Admin role required", 403);
  }

  await prisma.workspaceMember.delete({
    where: {
      workspaceId_userId: { workspaceId, userId: targetUserId },
    },
  });

  return apiSuccess({ removed: true });
};
