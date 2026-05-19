import { apiError, apiSuccess, parseJsonBody } from "@/lib/api";
import {
  requireUser,
  requireWorkspace,
  requireWorkspaceEditor,
} from "@/lib/api-auth";
import { ensureDefaultBrandKit, seedWorkspaceCaptionPresets } from "@/lib/brand-kit-defaults";
import { prisma } from "@clipforge/database";
import { createBrandKitSchema } from "@clipforge/shared";

export const GET = async (request: Request) => {
  const authResult = await requireUser();
  if ("error" in authResult) {
    return authResult.error;
  }

  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId");
  if (workspaceId === null || workspaceId === "") {
    return apiError("VALIDATION_ERROR", "workspaceId is required", 400);
  }

  const access = await requireWorkspace(authResult.userId, workspaceId);
  if ("error" in access) {
    return access.error;
  }

  await ensureDefaultBrandKit(workspaceId);

  const kits = await prisma.brandKit.findMany({
    where: { workspaceId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });

  return apiSuccess(kits);
};

export const POST = async (request: Request) => {
  const authResult = await requireUser();
  if ("error" in authResult) {
    return authResult.error;
  }

  const body = await parseJsonBody<unknown>(request);
  const parsed = createBrandKitSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", parsed.error.message, 400);
  }

  const access = await requireWorkspaceEditor(
    authResult.userId,
    parsed.data.workspaceId,
  );
  if ("error" in access) {
    return access.error;
  }

  if (parsed.data.isDefault === true) {
    await prisma.brandKit.updateMany({
      where: { workspaceId: parsed.data.workspaceId, isDefault: true },
      data: { isDefault: false },
    });
  }

  const kit = await prisma.brandKit.create({
    data: {
      workspaceId: parsed.data.workspaceId,
      name: parsed.data.name,
      primaryColor: parsed.data.primaryColor,
      secondaryColor: parsed.data.secondaryColor,
      fontFamily: parsed.data.fontFamily,
      hookFontSize: parsed.data.hookFontSize,
      isDefault: parsed.data.isDefault ?? false,
    },
  });

  await seedWorkspaceCaptionPresets(parsed.data.workspaceId, kit.id);

  return apiSuccess(kit, 201);
};
