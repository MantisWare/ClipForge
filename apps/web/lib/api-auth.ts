import { getSessionUserId } from "@/lib/auth";
import { assertWorkspaceAccess } from "@/lib/workspace";
import { apiError } from "@/lib/api";

export const requireUser = async () => {
  const userId = await getSessionUserId();
  if (userId === null) {
    return { error: apiError("UNAUTHORIZED", "Sign in required", 401) };
  }
  return { userId };
};

export const requireWorkspace = async (userId: string, workspaceId: string) => {
  const hasAccess = await assertWorkspaceAccess(userId, workspaceId);
  if (!hasAccess) {
    return { error: apiError("FORBIDDEN", "Workspace access denied", 403) };
  }
  return { ok: true as const };
};
