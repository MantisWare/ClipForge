import { apiError, apiSuccess, parseJsonBody } from "@/lib/api";
import { requireUser, requireWorkspaceEditor } from "@/lib/api-auth";
import { isOverlaysEnabled, overlaysDisabledResponse } from "@/lib/overlay-feature";
import { prisma, type Prisma } from "@clipforge/database";
import { updateOverlayTemplateSchema } from "@clipforge/shared";

export const PATCH = async (
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  if (!isOverlaysEnabled()) {
    return overlaysDisabledResponse();
  }

  const authResult = await requireUser();
  if ("error" in authResult) {
    return authResult.error;
  }

  const { id } = await params;
  const body = await parseJsonBody<unknown>(request);
  const parsed = updateOverlayTemplateSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", parsed.error.message, 400);
  }

  const template = await prisma.overlayTemplate.findUnique({ where: { id } });
  if (template === null) {
    return apiError("NOT_FOUND", "Template not found", 404);
  }

  const access = await requireWorkspaceEditor(
    authResult.userId,
    parsed.data.workspaceId,
  );
  if ("error" in access) {
    return access.error;
  }

  if (template.workspaceId !== parsed.data.workspaceId) {
    return apiError("FORBIDDEN", "Template not in workspace", 403);
  }

  const updated = await prisma.overlayTemplate.update({
    where: { id },
    data: {
      name: parsed.data.name,
      config:
        parsed.data.config !== undefined
          ? (parsed.data.config as Prisma.InputJsonValue)
          : undefined,
    },
  });

  return apiSuccess(updated);
};

export const DELETE = async (
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  if (!isOverlaysEnabled()) {
    return overlaysDisabledResponse();
  }

  const authResult = await requireUser();
  if ("error" in authResult) {
    return authResult.error;
  }

  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId");
  if (workspaceId === null || workspaceId === "") {
    return apiError("VALIDATION_ERROR", "workspaceId is required", 400);
  }

  const { id } = await params;
  const template = await prisma.overlayTemplate.findUnique({ where: { id } });
  if (template === null) {
    return apiError("NOT_FOUND", "Template not found", 404);
  }

  const access = await requireWorkspaceEditor(authResult.userId, workspaceId);
  if ("error" in access) {
    return access.error;
  }

  if (template.workspaceId !== workspaceId) {
    return apiError("FORBIDDEN", "Template not in workspace", 403);
  }

  await prisma.overlayTemplate.delete({ where: { id } });
  return apiSuccess({ deleted: true });
};
