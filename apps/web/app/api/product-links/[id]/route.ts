import { apiError, apiSuccess, parseJsonBody } from "@/lib/api";
import { requireUser, requireWorkspaceEditor } from "@/lib/api-auth";
import { isOverlaysEnabled, overlaysDisabledResponse } from "@/lib/overlay-feature";
import { validateProductUrl } from "@/lib/url-safety";
import { prisma } from "@clipforge/database";
import { updateProductLinkSchema } from "@clipforge/shared";

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
  const parsed = updateProductLinkSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", parsed.error.message, 400);
  }

  const link = await prisma.productLink.findUnique({ where: { id } });
  if (link === null) {
    return apiError("NOT_FOUND", "Product link not found", 404);
  }

  const access = await requireWorkspaceEditor(
    authResult.userId,
    parsed.data.workspaceId,
  );
  if ("error" in access) {
    return access.error;
  }

  if (link.workspaceId !== parsed.data.workspaceId) {
    return apiError("FORBIDDEN", "Product link not in workspace", 403);
  }

  let nextUrl = link.url;
  if (parsed.data.url !== undefined) {
    const settings = await prisma.workspaceOverlaySettings.findUnique({
      where: { workspaceId: parsed.data.workspaceId },
    });
    const urlCheck = validateProductUrl(
      parsed.data.url,
      settings?.urlAllowlist ?? [],
    );
    if (!urlCheck.ok) {
      return apiError("VALIDATION_ERROR", urlCheck.reason, 400);
    }
    nextUrl = urlCheck.url;
  }

  const updated = await prisma.productLink.update({
    where: { id },
    data: {
      title: parsed.data.title,
      url: nextUrl,
      imageUrl: parsed.data.imageUrl,
      priceLabel: parsed.data.priceLabel,
      affiliateNetwork: parsed.data.affiliateNetwork,
      disclosureText: parsed.data.disclosureText,
      active: parsed.data.active,
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
  const link = await prisma.productLink.findUnique({ where: { id } });
  if (link === null) {
    return apiError("NOT_FOUND", "Product link not found", 404);
  }

  const access = await requireWorkspaceEditor(authResult.userId, workspaceId);
  if ("error" in access) {
    return access.error;
  }

  if (link.workspaceId !== workspaceId) {
    return apiError("FORBIDDEN", "Product link not in workspace", 403);
  }

  await prisma.productLink.delete({ where: { id } });
  return apiSuccess({ deleted: true });
};
