import { apiError, apiSuccess, parseJsonBody } from "@/lib/api";
import { requireUser } from "@/lib/api-auth";
import {
  assertWorkspaceAccess,
  requireWorkspaceRole,
} from "@/lib/workspace";
import { prisma } from "@clipforge/database";
import { updateWorkspaceSchema } from "@clipforge/shared";

export const GET = async (
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  const authResult = await requireUser();
  if ("error" in authResult) {
    return authResult.error;
  }

  const { id } = await params;
  const hasAccess = await assertWorkspaceAccess(authResult.userId, id);
  if (!hasAccess) {
    return apiError("FORBIDDEN", "Workspace access denied", 403);
  }

  const workspace = await prisma.workspace.findUnique({ where: { id } });
  if (workspace === null) {
    return apiError("NOT_FOUND", "Workspace not found", 404);
  }

  return apiSuccess(workspace);
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
  const canEdit = await requireWorkspaceRole(authResult.userId, id, "admin");
  if (!canEdit) {
    return apiError("FORBIDDEN", "Admin role required", 403);
  }

  const body = await parseJsonBody<unknown>(request);
  const parsed = updateWorkspaceSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", parsed.error.message, 400);
  }

  const workspace = await prisma.workspace.update({
    where: { id },
    data: { name: parsed.data.name },
  });

  return apiSuccess(workspace);
};

export const DELETE = async (
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  const authResult = await requireUser();
  if ("error" in authResult) {
    return authResult.error;
  }

  const { id } = await params;
  const isOwner = await requireWorkspaceRole(authResult.userId, id, "owner");
  if (!isOwner) {
    return apiError("FORBIDDEN", "Owner role required", 403);
  }

  await prisma.workspace.delete({ where: { id } });
  return apiSuccess({ deleted: true });
};
