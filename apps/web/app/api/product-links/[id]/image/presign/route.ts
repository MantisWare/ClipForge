import { apiError, apiSuccess, parseJsonBody } from "@/lib/api";
import { requireUser, requireWorkspaceEditor } from "@/lib/api-auth";
import { isOverlaysEnabled, overlaysDisabledResponse } from "@/lib/overlay-feature";
import { prisma } from "@clipforge/database";
import {
  buildProductLinkImageStorageKey,
  getSignedUploadUrl,
} from "@clipforge/shared";
import { z } from "zod";

const presignSchema = z.object({
  workspaceId: z.string().min(1),
  contentType: z.enum(["image/png", "image/jpeg", "image/webp"]),
});

const extensionForContentType = (
  contentType: string,
): "png" | "jpg" | "webp" => {
  if (contentType === "image/jpeg") {
    return "jpg";
  }
  if (contentType === "image/webp") {
    return "webp";
  }
  return "png";
};

export const POST = async (
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
  const parsed = presignSchema.safeParse(body);
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

  const ext = extensionForContentType(parsed.data.contentType);
  const storageKey = buildProductLinkImageStorageKey(
    parsed.data.workspaceId,
    id,
    ext,
  );

  const uploadUrl = await getSignedUploadUrl(
    storageKey,
    parsed.data.contentType,
    3600,
  );

  await prisma.productLink.update({
    where: { id },
    data: { imageStorageKey: storageKey },
  });

  return apiSuccess({ storageKey, uploadUrl, expiresIn: 3600 });
};
