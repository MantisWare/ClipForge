import { cookies } from "next/headers";
import { prisma, type Workspace } from "@clipforge/database";
import {
  assertWorkspaceAccess,
  ensureDefaultWorkspace,
  getUserWorkspaces,
} from "@/lib/workspace";

export const WORKSPACE_COOKIE = "clipforge_workspace_id";

export const getActiveWorkspace = async (
  userId: string,
): Promise<Workspace> => {
  const cookieStore = await cookies();
  const cookieId = cookieStore.get(WORKSPACE_COOKIE)?.value;

  if (cookieId !== undefined && cookieId !== "") {
    const hasAccess = await assertWorkspaceAccess(userId, cookieId);
    if (hasAccess) {
      const workspace = await prisma.workspace.findUnique({
        where: { id: cookieId },
      });
      if (workspace !== null) {
        return workspace;
      }
    }
  }

  const workspaces = await getUserWorkspaces(userId);
  if (workspaces.length > 0) {
    return workspaces[0]!;
  }

  return ensureDefaultWorkspace(userId);
};
