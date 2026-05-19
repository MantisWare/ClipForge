import { apiError, apiSuccess, parseJsonBody } from "@/lib/api";
import { requireUser, requireWorkspace, requireWorkspaceEditor } from "@/lib/api-auth";
import { loadClipForWorkspace, requireApprovedClip } from "@/lib/clip-access";
import { isOverlaysEnabled, overlaysDisabledResponse } from "@/lib/overlay-feature";
import { prisma, type Prisma } from "@clipforge/database";
import { replaceClipOverlaysSchema } from "@clipforge/shared";

export const GET = async (
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

  const access = await requireWorkspace(authResult.userId, workspaceId);
  if ("error" in access) {
    return access.error;
  }

  const { id } = await params;
  const loaded = await loadClipForWorkspace(id);
  if ("error" in loaded) {
    return loaded.error;
  }

  if (loaded.workspaceId !== workspaceId) {
    return apiError("FORBIDDEN", "Clip not in workspace", 403);
  }

  const overlays = await prisma.clipOverlay.findMany({
    where: { clipCandidateId: id },
    include: { productLink: true, template: true },
    orderBy: [{ sortOrder: "asc" }, { startMs: "asc" }],
  });

  return apiSuccess(overlays);
};

export const PUT = async (
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
  const parsed = replaceClipOverlaysSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", parsed.error.message, 400);
  }

  const loaded = await loadClipForWorkspace(id);
  if ("error" in loaded) {
    return loaded.error;
  }

  const access = await requireWorkspaceEditor(
    authResult.userId,
    parsed.data.workspaceId,
  );
  if ("error" in access) {
    return access.error;
  }

  if (loaded.workspaceId !== parsed.data.workspaceId) {
    return apiError("FORBIDDEN", "Clip not in workspace", 403);
  }

  const statusError = requireApprovedClip(loaded.clip.status);
  if (statusError !== null) {
    return statusError;
  }

  const snapshot = parsed.data.overlays;

  const result = await prisma.$transaction(async (tx) => {
    const previous = await tx.clipOverlay.findMany({
      where: { clipCandidateId: id },
    });

    if (previous.length > 0) {
      await tx.clipOverlayRevision.create({
        data: {
          clipCandidateId: id,
          snapshot: previous as unknown as Prisma.InputJsonValue,
        },
      });
    }

    await tx.clipOverlay.deleteMany({ where: { clipCandidateId: id } });

    const created = await Promise.all(
      parsed.data.overlays.map((o, index) =>
        tx.clipOverlay.create({
          data: {
            clipCandidateId: id,
            overlayType: o.overlayType,
            templateId: o.templateId,
            productLinkId: o.productLinkId,
            startMs: o.startMs,
            endMs: o.endMs,
            position: o.position as Prisma.InputJsonValue,
            style: o.style as Prisma.InputJsonValue,
            compliance: o.compliance,
            sortOrder: o.sortOrder ?? index,
            isDraft: o.isDraft ?? false,
          },
          include: { productLink: true, template: true },
        }),
      ),
    );

    return created;
  });

  return apiSuccess(result);
};
