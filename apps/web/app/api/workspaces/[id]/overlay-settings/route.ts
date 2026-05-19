import { apiError, apiSuccess, parseJsonBody } from "@/lib/api";
import {
  requireUser,
  requireWorkspace,
  requireWorkspaceEditor,
} from "@/lib/api-auth";
import { ensureOverlayCatalog } from "@/lib/overlay-defaults";
import { isOverlaysEnabled, overlaysDisabledResponse } from "@/lib/overlay-feature";
import { prisma } from "@clipforge/database";
import { updateWorkspaceOverlaySettingsSchema } from "@clipforge/shared";

export const GET = async (
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  if (!isOverlaysEnabled()) {
    return overlaysDisabledResponse();
  }

  const authResult = await requireUser();
  if ("error" in authResult) {
    return authResult.error;
  }

  const { id: workspaceId } = await params;
  const access = await requireWorkspace(authResult.userId, workspaceId);
  if ("error" in access) {
    return access.error;
  }

  const settings = await ensureOverlayCatalog(workspaceId);
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { renderWebhookUrl: true },
  });

  return apiSuccess({
    workspaceId: settings.workspaceId,
    defaultDisclosureText: settings.defaultDisclosureText,
    defaultLocale: settings.defaultLocale,
    urlAllowlist: settings.urlAllowlist,
    requireDisclosureOnExport: settings.requireDisclosureOnExport,
    createdAt: settings.createdAt,
    updatedAt: settings.updatedAt,
    renderWebhookUrl: workspace?.renderWebhookUrl ?? null,
  });
};

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

  const { id: workspaceId } = await params;
  const access = await requireWorkspaceEditor(authResult.userId, workspaceId);
  if ("error" in access) {
    return access.error;
  }

  const body = await parseJsonBody<unknown>(request);
  const parsed = updateWorkspaceOverlaySettingsSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", parsed.error.message, 400);
  }

  await ensureOverlayCatalog(workspaceId);

  const { renderWebhookUrl, ...settingsData } = parsed.data;

  if (renderWebhookUrl !== undefined) {
    await prisma.workspace.update({
      where: { id: workspaceId },
      data: { renderWebhookUrl },
    });
  }

  const settings = await prisma.workspaceOverlaySettings.update({
    where: { workspaceId },
    data: settingsData,
  });

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { renderWebhookUrl: true },
  });

  return apiSuccess({
    workspaceId: settings.workspaceId,
    defaultDisclosureText: settings.defaultDisclosureText,
    defaultLocale: settings.defaultLocale,
    urlAllowlist: settings.urlAllowlist,
    requireDisclosureOnExport: settings.requireDisclosureOnExport,
    createdAt: settings.createdAt,
    updatedAt: settings.updatedAt,
    renderWebhookUrl: workspace?.renderWebhookUrl ?? null,
  });
};
