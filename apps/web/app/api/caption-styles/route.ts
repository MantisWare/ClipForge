import { apiError, apiSuccess, parseJsonBody } from "@/lib/api";
import {
  requireUser,
  requireWorkspace,
  requireWorkspaceEditor,
} from "@/lib/api-auth";
import { ensureDefaultBrandKit } from "@/lib/brand-kit-defaults";
import { prisma, type Prisma } from "@clipforge/database";
import { createCaptionStyleSchema } from "@clipforge/shared";

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

  const styles = await prisma.captionStylePreset.findMany({
    where: { workspaceId },
    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
  });

  return apiSuccess(styles);
};

export const POST = async (request: Request) => {
  const authResult = await requireUser();
  if ("error" in authResult) {
    return authResult.error;
  }

  const body = await parseJsonBody<unknown>(request);
  const parsed = createCaptionStyleSchema.safeParse(body);
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
    await prisma.captionStylePreset.updateMany({
      where: { workspaceId: parsed.data.workspaceId, isDefault: true },
      data: { isDefault: false },
    });
  }

  const style = await prisma.captionStylePreset.create({
    data: {
      workspaceId: parsed.data.workspaceId,
      brandKitId: parsed.data.brandKitId,
      name: parsed.data.name,
      presetKey: parsed.data.presetKey,
      assTemplate: (parsed.data.assTemplate ?? {}) as Prisma.InputJsonValue,
      isDefault: parsed.data.isDefault ?? false,
    },
  });

  return apiSuccess(style, 201);
};
