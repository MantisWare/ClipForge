import { apiError, apiSuccess } from "@/lib/api";
import { requireUser, requireWorkspace } from "@/lib/api-auth";
import { buildPublishMetadataForRendered } from "@/lib/publish-description";
import { prisma } from "@clipforge/database";

export const GET = async (
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

  const rendered = await prisma.renderedClip.findUnique({
    where: { id },
    include: {
      clipCandidate: { select: { sourceVideoId: true } },
    },
  });

  if (rendered === null) {
    return apiError("NOT_FOUND", "Rendered clip not found", 404);
  }

  if (workspaceId === null || workspaceId === "") {
    return apiError("VALIDATION_ERROR", "workspaceId is required", 400);
  }

  if (rendered.workspaceId !== workspaceId) {
    return apiError("FORBIDDEN", "Rendered clip not in workspace", 403);
  }

  const access = await requireWorkspace(authResult.userId, workspaceId);
  if ("error" in access) {
    return access.error;
  }

  const metadata = await buildPublishMetadataForRendered(
    id,
    workspaceId,
    null,
    undefined,
  );

  return apiSuccess({
    description: metadata.description,
    linksText: metadata.linksText,
    hasAffiliateOverlays: metadata.hasAffiliateOverlays,
    sourceVideoId: rendered.clipCandidate.sourceVideoId,
    clipCandidateId: rendered.clipCandidateId,
  });
};
