import { apiError, apiSuccess, parseJsonBody } from "@/lib/api";
import {
  requireUser,
  requireWorkspace,
  requireWorkspaceEditor,
} from "@/lib/api-auth";
import { ensureOverlayCatalog } from "@/lib/overlay-defaults";
import { isOverlaysEnabled, overlaysDisabledResponse } from "@/lib/overlay-feature";
import { prisma, type Prisma } from "@clipforge/database";
import { createOverlayTemplateSchema } from "@clipforge/shared";

export const GET = async (request: Request) => {
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

  const access = await requireWorkspace(authResult.userId, workspaceId);
  if ("error" in access) {
    return access.error;
  }

  await ensureOverlayCatalog(workspaceId);

  const templates = await prisma.overlayTemplate.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "asc" },
  });

  return apiSuccess(templates);
};

export const POST = async (request: Request) => {
  if (!isOverlaysEnabled()) {
    return overlaysDisabledResponse();
  }

  const authResult = await requireUser();
  if ("error" in authResult) {
    return authResult.error;
  }

  const body = await parseJsonBody<unknown>(request);
  const parsed = createOverlayTemplateSchema.safeParse(body);
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

  const template = await prisma.overlayTemplate.create({
    data: {
      workspaceId: parsed.data.workspaceId,
      name: parsed.data.name,
      overlayType: parsed.data.overlayType,
      config: parsed.data.config as Prisma.InputJsonValue,
    },
  });

  return apiSuccess(template, 201);
};
