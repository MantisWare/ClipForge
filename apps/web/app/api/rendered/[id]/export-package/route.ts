import { apiError, apiSuccess } from "@/lib/api";
import { requireUser, requireWorkspace } from "@/lib/api-auth";
import { buildPublishMetadataForRendered } from "@/lib/publish-description";
import {
  buildRenderedStorageKey,
  getSignedDownloadUrl,
} from "@clipforge/shared";
import { prisma, RenderStatus } from "@clipforge/database";

export const GET = async (
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  const authResult = await requireUser();
  if ("error" in authResult) {
    return authResult.error;
  }

  const { id } = await params;
  const rendered = await prisma.renderedClip.findUnique({
    where: { id },
  });

  if (rendered === null) {
    return apiError("NOT_FOUND", "Rendered clip not found", 404);
  }

  const access = await requireWorkspace(
    authResult.userId,
    rendered.workspaceId,
  );
  if ("error" in access) {
    return access.error;
  }

  if (rendered.status !== RenderStatus.ready) {
    return apiError("VALIDATION_ERROR", "Rendered clip is not ready", 400);
  }

  const metadata = await buildPublishMetadataForRendered(
    id,
    rendered.workspaceId,
  );

  const files: Record<string, { url: string; expiresIn: number } | null> = {};

  if (rendered.storageKey !== null) {
    files.monetized = {
      url: await getSignedDownloadUrl(rendered.storageKey, 600),
      expiresIn: 600,
    };
  }

  const cleanKey =
    rendered.cleanStorageKey ??
    buildRenderedStorageKey(rendered.workspaceId, id, "clean.mp4");
  files.clean = {
    url: await getSignedDownloadUrl(cleanKey, 600),
    expiresIn: 600,
  };

  if (rendered.overlaysManifestKey !== null) {
    files.overlaysJson = {
      url: await getSignedDownloadUrl(rendered.overlaysManifestKey, 600),
      expiresIn: 600,
    };
  }

  return apiSuccess({
    files,
    linksText: metadata.linksText,
  });
};
