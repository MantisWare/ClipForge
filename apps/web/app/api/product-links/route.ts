import { apiError, apiSuccess, parseJsonBody } from "@/lib/api";
import {
  requireUser,
  requireWorkspace,
  requireWorkspaceEditor,
} from "@/lib/api-auth";
import { isOverlaysEnabled, overlaysDisabledResponse } from "@/lib/overlay-feature";
import { validateProductUrl } from "@/lib/url-safety";
import { prisma } from "@clipforge/database";
import { createProductLinkSchema } from "@clipforge/shared";

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

  const links = await prisma.productLink.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
  });

  return apiSuccess(links);
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
  const parsed = createProductLinkSchema.safeParse(body);
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

  const link = await prisma.productLink.create({
    data: {
      workspaceId: parsed.data.workspaceId,
      title: parsed.data.title,
      url: urlCheck.url,
      imageUrl: parsed.data.imageUrl,
      priceLabel: parsed.data.priceLabel,
      affiliateNetwork: parsed.data.affiliateNetwork,
      disclosureText: parsed.data.disclosureText,
      active: parsed.data.active,
    },
  });

  return apiSuccess(link, 201);
};
