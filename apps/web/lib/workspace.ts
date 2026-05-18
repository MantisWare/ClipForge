import { prisma } from "@clipforge/database";

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
