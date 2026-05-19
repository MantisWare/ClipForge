import { apiError } from "@/lib/api";

export const requireAdmin = (userId: string) => {
  const raw = process.env.ADMIN_USER_IDS ?? "";
  const adminIds = raw
    .split(",")
    .map((id) => id.trim())
    .filter((id) => id !== "");

  if (adminIds.length === 0) {
    return {
      error: apiError("FORBIDDEN", "Admin access is not configured", 403),
    };
  }

  if (!adminIds.includes(userId)) {
    return { error: apiError("FORBIDDEN", "Admin access required", 403) };
  }

  return { ok: true as const };
};
