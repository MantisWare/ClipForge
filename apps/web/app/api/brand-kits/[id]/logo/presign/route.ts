import { apiError, apiSuccess, parseJsonBody } from "@/lib/api";
import { requireUser, requireWorkspaceEditor } from "@/lib/api-auth";
import { prisma } from "@clipforge/database";
import {
  brandKitLogoPresignSchema,
  buildBrandKitLogoStorageKey,
} from "@clipforge/shared";
import { getSignedUploadUrl } from "@clipforge/shared/server";

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
  const authResult = await requireUser();
  if ("error" in authResult) {
    return authResult.error;
  }

  const { id } = await params;
  const body = await parseJsonBody<unknown>(request);
  const parsed = brandKitLogoPresignSchema.safeParse(body);
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

  const ext = extensionForContentType(parsed.data.contentType);
  const storageKey = buildBrandKitLogoStorageKey(
    parsed.data.workspaceId,
    id,
    ext,
  );

  const uploadUrl = await getSignedUploadUrl(
    storageKey,
    parsed.data.contentType,
    3600,
  );

  await prisma.brandKit.update({
    where: { id },
    data: { logoStorageKey: storageKey },
  });

  return apiSuccess({ storageKey, uploadUrl, expiresIn: 3600 });
};
