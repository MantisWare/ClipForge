import { apiError } from "@/lib/api";
import { getQuotaConfig } from "@clipforge/shared";
import { prisma } from "@clipforge/database";

export const assertSourceQuota = async (workspaceId: string) => {
  const { maxSourcesPerWorkspace } = getQuotaConfig();
  if (maxSourcesPerWorkspace === null) {
    return { ok: true as const };
  }

  const count = await prisma.sourceVideo.count({ where: { workspaceId } });
  if (count >= maxSourcesPerWorkspace) {
    return {
      error: apiError(
        "QUOTA_EXCEEDED",
        `Workspace source limit reached (${maxSourcesPerWorkspace})`,
        429,
      ),
    };
  }
  return { ok: true as const };
};

export const assertRenderQuota = async (workspaceId: string) => {
  const { maxRendersPerDay } = getQuotaConfig();
  if (maxRendersPerDay === null) {
    return { ok: true as const };
  }

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const count = await prisma.renderedClip.count({
    where: {
      workspaceId,
      createdAt: { gte: startOfDay },
    },
  });

  if (count >= maxRendersPerDay) {
    return {
      error: apiError(
        "QUOTA_EXCEEDED",
        `Daily render limit reached (${maxRendersPerDay})`,
        429,
      ),
    };
  }
  return { ok: true as const };
};
