import { BUILTIN_OVERLAY_TEMPLATES } from "@clipforge/shared";
import { prisma, type Prisma } from "@clipforge/database";

export const ensureWorkspaceOverlaySettings = async (workspaceId: string) => {
  const existing = await prisma.workspaceOverlaySettings.findUnique({
    where: { workspaceId },
  });
  if (existing !== null) {
    return existing;
  }

  return prisma.workspaceOverlaySettings.create({
    data: {
      workspaceId,
      defaultDisclosureText:
        "Links may earn a commission. #ad",
      requireDisclosureOnExport: true,
    },
  });
};

export const seedBuiltinOverlayTemplates = async (workspaceId: string) => {
  const count = await prisma.overlayTemplate.count({ where: { workspaceId } });
  if (count > 0) {
    return;
  }

  await prisma.overlayTemplate.createMany({
    data: BUILTIN_OVERLAY_TEMPLATES.map((t) => ({
      workspaceId,
      name: t.name,
      overlayType: t.overlayType,
      config: t.config as Prisma.InputJsonValue,
    })),
  });
};

export const ensureOverlayCatalog = async (workspaceId: string) => {
  const settings = await ensureWorkspaceOverlaySettings(workspaceId);
  await seedBuiltinOverlayTemplates(workspaceId);
  return settings;
};
