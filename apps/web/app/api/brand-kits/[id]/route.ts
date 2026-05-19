import { apiError, apiSuccess, parseJsonBody } from "@/lib/api";
import {
  requireUser,
  requireWorkspaceAdmin,
  requireWorkspaceEditor,
} from "@/lib/api-auth";
import { prisma } from "@clipforge/database";
import { updateBrandKitSchema } from "@clipforge/shared";

export const PATCH = async (
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  const authResult = await requireUser();
  if ("error" in authResult) {
    return authResult.error;
  }

  const { id } = await params;
  const body = await parseJsonBody<unknown>(request);
  const parsed = updateBrandKitSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", parsed.error.message, 400);
  }

  const kit = await prisma.brandKit.findUnique({ where: { id } });
  if (kit === null) {
    return apiError("NOT_FOUND", "Brand kit not found", 404);
  }

  const access = await requireWorkspaceEditor(
    authResult.userId,
    parsed.data.workspaceId,
  );
  if ("error" in access) {
    return access.error;
  }

  if (kit.workspaceId !== parsed.data.workspaceId) {
    return apiError("FORBIDDEN", "Brand kit not in workspace", 403);
  }

  if (parsed.data.isDefault === true) {
    await prisma.brandKit.updateMany({
      where: { workspaceId: kit.workspaceId, isDefault: true },
      data: { isDefault: false },
    });
  }

  const updated = await prisma.brandKit.update({
    where: { id },
    data: {
      name: parsed.data.name,
      primaryColor: parsed.data.primaryColor,
      secondaryColor: parsed.data.secondaryColor,
      fontFamily: parsed.data.fontFamily,
      hookFontSize: parsed.data.hookFontSize,
      isDefault: parsed.data.isDefault,
      logoStorageKey: parsed.data.logoStorageKey,
    },
  });

  return apiSuccess(updated);
};

export const DELETE = async (
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  const authResult = await requireUser();
  if ("error" in authResult) {
    return authResult.error;
  }

  const { id } = await params;
  const kit = await prisma.brandKit.findUnique({ where: { id } });
  if (kit === null) {
    return apiError("NOT_FOUND", "Brand kit not found", 404);
  }

  const access = await requireWorkspaceAdmin(
    authResult.userId,
    kit.workspaceId,
  );
  if ("error" in access) {
    return access.error;
  }

  if (kit.isDefault) {
    return apiError(
      "VALIDATION_ERROR",
      "Cannot delete the default brand kit",
      400,
    );
  }

  await prisma.brandKit.delete({ where: { id } });
  return apiSuccess({ deleted: true });
};
