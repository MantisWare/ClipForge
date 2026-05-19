import { BUILTIN_CAPTION_PRESETS } from "@clipforge/shared";
import { prisma, type Prisma } from "@clipforge/database";

export const seedWorkspaceCaptionPresets = async (
  workspaceId: string,
  brandKitId?: string,
) => {
  const existing = await prisma.captionStylePreset.count({
    where: { workspaceId },
  });
  if (existing > 0) {
    return;
  }

  await prisma.captionStylePreset.createMany({
    data: BUILTIN_CAPTION_PRESETS.map((preset, index) => ({
      workspaceId,
      brandKitId: brandKitId ?? null,
      name: preset.name,
      presetKey: preset.presetKey,
      assTemplate: preset.assTemplate as Prisma.InputJsonValue,
      isDefault: index === 0,
    })),
  });
};

export const ensureDefaultBrandKit = async (workspaceId: string) => {
  const existing = await prisma.brandKit.findFirst({
    where: { workspaceId, isDefault: true },
  });
  if (existing !== null) {
    return existing;
  }

  const kit = await prisma.brandKit.create({
    data: {
      workspaceId,
      name: "Default",
      isDefault: true,
      primaryColor: "#FFFFFF",
      fontFamily: "Inter",
    },
  });

  await seedWorkspaceCaptionPresets(workspaceId, kit.id);
  return kit;
};
