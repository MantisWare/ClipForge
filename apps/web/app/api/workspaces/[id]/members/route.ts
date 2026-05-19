import { apiError, apiSuccess, parseJsonBody } from "@/lib/api";
import { requireUser } from "@/lib/api-auth";
import {
  assertWorkspaceAccess,
  requireWorkspaceRole,
} from "@/lib/workspace";
import { prisma } from "@clipforge/database";
import { inviteMemberSchema } from "@clipforge/shared";

export const GET = async (
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  const authResult = await requireUser();
  if ("error" in authResult) {
    return authResult.error;
  }

  const { id: workspaceId } = await params;
  const hasAccess = await assertWorkspaceAccess(
    authResult.userId,
    workspaceId,
  );
  if (!hasAccess) {
    return apiError("FORBIDDEN", "Workspace access denied", 403);
  }

  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId },
    include: {
      user: {
        select: { id: true, email: true, name: true, image: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return apiSuccess(members);
};

export const POST = async (
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  const authResult = await requireUser();
  if ("error" in authResult) {
    return authResult.error;
  }

  const { id: workspaceId } = await params;
  const canInvite = await requireWorkspaceRole(
    authResult.userId,
    workspaceId,
    "admin",
  );
  if (!canInvite) {
    return apiError("FORBIDDEN", "Admin role required", 403);
  }

  const body = await parseJsonBody<unknown>(request);
  const parsed = inviteMemberSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", parsed.error.message, 400);
  }

  const user = await prisma.user.upsert({
    where: { email: parsed.data.email },
    update: {},
    create: {
      email: parsed.data.email,
      name: parsed.data.email.split("@")[0],
    },
  });

  const member = await prisma.workspaceMember.upsert({
    where: {
      workspaceId_userId: { workspaceId, userId: user.id },
    },
    update: { role: parsed.data.role },
    create: {
      workspaceId,
      userId: user.id,
      role: parsed.data.role,
    },
    include: {
      user: {
        select: { id: true, email: true, name: true },
      },
    },
  });

  return apiSuccess(member, 201);
};
