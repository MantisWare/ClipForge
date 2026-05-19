"use server";

import { cookies } from "next/headers";
import { getSessionUserId } from "@/lib/auth";
import { WORKSPACE_COOKIE } from "@/lib/workspace-context";
import { assertWorkspaceAccess } from "@/lib/workspace";

export const setActiveWorkspace = async (workspaceId: string) => {
  const userId = await getSessionUserId();
  if (userId === null) {
    throw new Error("Unauthorized");
  }

  const hasAccess = await assertWorkspaceAccess(userId, workspaceId);
  if (!hasAccess) {
    throw new Error("Workspace access denied");
  }

  const cookieStore = await cookies();
  cookieStore.set(WORKSPACE_COOKIE, workspaceId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
  });
};
