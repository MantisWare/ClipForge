import { apiError, apiSuccess, parseJsonBody } from "@/lib/api";
import { requireUser, requireWorkspaceEditor } from "@/lib/api-auth";
import { prisma, type Prisma } from "@clipforge/database";
import { updateCaptionStyleSchema } from "@clipforge/shared";

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
  const parsed = updateCaptionStyleSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", parsed.error.message, 400);
  }

  const style = await prisma.captionStylePreset.findUnique({ where: { id } });
  if (style === null) {
    return apiError("NOT_FOUND", "Caption style not found", 404);
  }

  const access = await requireWorkspaceEditor(
    authResult.userId,
    parsed.data.workspaceId,
  );
  if ("error" in access) {
    return access.error;
  }

  if (style.workspaceId !== parsed.data.workspaceId) {
    return apiError("FORBIDDEN", "Caption style not in workspace", 403);
  }

  if (parsed.data.isDefault === true) {
    await prisma.captionStylePreset.updateMany({
      where: { workspaceId: style.workspaceId, isDefault: true },
      data: { isDefault: false },
    });
  }

  const updated = await prisma.captionStylePreset.update({
    where: { id },
    data: {
      name: parsed.data.name,
      brandKitId: parsed.data.brandKitId,
      assTemplate:
        parsed.data.assTemplate !== undefined
          ? (parsed.data.assTemplate as Prisma.InputJsonValue)
          : undefined,
      isDefault: parsed.data.isDefault,
    },
  });

  return apiSuccess(updated);
};

export const DELETE = async (
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  const authResult = await requireUser();
  if ("error" in authResult) {
    return authResult.error;
  }

  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId");
  if (workspaceId === null || workspaceId === "") {
    return apiError("VALIDATION_ERROR", "workspaceId is required", 400);
  }

  const style = await prisma.captionStylePreset.findUnique({ where: { id } });
  if (style === null) {
    return apiError("NOT_FOUND", "Caption style not found", 404);
  }

  const access = await requireWorkspaceEditor(authResult.userId, workspaceId);
  if ("error" in access) {
    return access.error;
  }

  if (style.workspaceId !== workspaceId) {
    return apiError("FORBIDDEN", "Caption style not in workspace", 403);
  }

  if (style.isDefault) {
    return apiError(
      "VALIDATION_ERROR",
      "Cannot delete the default caption style",
      400,
    );
  }

  await prisma.captionStylePreset.delete({ where: { id } });
  return apiSuccess({ deleted: true });
};
