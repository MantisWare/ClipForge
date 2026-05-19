import { prisma, type WorkspaceRole } from "@clipforge/database";

const roleRank: Record<WorkspaceRole, number> = {
  owner: 4,
  admin: 3,
  editor: 2,
  viewer: 1,
};

export const getUserWorkspaces = async (userId: string) =>
  prisma.workspace.findMany({
    where: {
      OR: [
        { ownerId: userId },
        { members: { some: { userId } } },
      ],
    },
    orderBy: { createdAt: "desc" },
  });

export const assertWorkspaceAccess = async (
  userId: string,
  workspaceId: string,
): Promise<boolean> => {
  const workspace = await prisma.workspace.findFirst({
    where: {
      id: workspaceId,
      OR: [
        { ownerId: userId },
        { members: { some: { userId } } },
      ],
    },
  });
  return workspace !== null;
};

export const getMemberRole = async (
  userId: string,
  workspaceId: string,
): Promise<WorkspaceRole | null> => {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: {
      members: { where: { userId } },
    },
  });

  if (workspace === null) {
    return null;
  }

  if (workspace.ownerId === userId) {
    return "owner";
  }

  const member = workspace.members[0];
  return member?.role ?? null;
};

export const requireWorkspaceRole = async (
  userId: string,
  workspaceId: string,
  minRole: WorkspaceRole,
): Promise<boolean> => {
  const role = await getMemberRole(userId, workspaceId);
  if (role === null) {
    return false;
  }
  return roleRank[role] >= roleRank[minRole];
};

export const getOrCreateDefaultWorkspace = async (userId: string) => {
  const existing = await prisma.workspace.findFirst({
    where: { ownerId: userId },
    orderBy: { createdAt: "asc" },
  });

  if (existing !== null) {
    return existing;
  }

  return prisma.workspace.create({
    data: {
      name: "My Workspace",
      ownerId: userId,
      members: {
        create: {
          userId,
          role: "owner",
        },
      },
    },
  });
};
