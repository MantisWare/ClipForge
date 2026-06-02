import { apiError } from "@/lib/api";

const parseAdminUserIds = (): string[] => {
  const raw = process.env.ADMIN_USER_IDS ?? "";
  return raw
    .split(",")
    .map((id) => id.trim())
    .filter((id) => id !== "");
};

/** Platform admin (not workspace role). In development, all signed-in users are admins when ADMIN_USER_IDS is unset. */
export const isPlatformAdmin = (userId: string): boolean => {
  const adminIds = parseAdminUserIds();

  if (adminIds.length === 0) {
    return process.env.NODE_ENV === "development";
  }

  return adminIds.includes(userId);
};

export const requireAdmin = (userId: string) => {
  if (!isPlatformAdmin(userId)) {
    const adminIds = parseAdminUserIds();
    if (adminIds.length === 0) {
      return {
        error: apiError(
          "FORBIDDEN",
          "Admin access is not configured. Set ADMIN_USER_IDS in your environment.",
          403,
        ),
      };
    }
    return { error: apiError("FORBIDDEN", "Admin access required", 403) };
  }

  return { ok: true as const };
};
