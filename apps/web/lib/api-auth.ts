import { getSessionUserId } from "@/lib/auth";
import { assertWorkspaceAccess, requireWorkspaceRole } from "@/lib/workspace";
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

/** Viewers may read; editors+ may mutate workspace content. */
export const requireWorkspaceEditor = async (
  userId: string,
  workspaceId: string,
) => {
  const access = await requireWorkspace(userId, workspaceId);
  if ("error" in access) {
    return access;
  }
  const canEdit = await requireWorkspaceRole(userId, workspaceId, "editor");
  if (!canEdit) {
    return { error: apiError("FORBIDDEN", "Editor access required", 403) };
  }
  return { ok: true as const };
};

export const requireWorkspaceAdmin = async (
  userId: string,
  workspaceId: string,
) => {
  const access = await requireWorkspace(userId, workspaceId);
  if ("error" in access) {
    return access;
  }
  const canAdmin = await requireWorkspaceRole(userId, workspaceId, "admin");
  if (!canAdmin) {
    return { error: apiError("FORBIDDEN", "Admin access required", 403) };
  }
  return { ok: true as const };
};
