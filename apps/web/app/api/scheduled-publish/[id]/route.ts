import { apiError, apiSuccess, parseJsonBody } from "@/lib/api";
import { requireUser, requireWorkspaceEditor } from "@/lib/api-auth";
import { prisma, ScheduledPublishStatus } from "@clipforge/database";
import { updateScheduledPublishSchema } from "@clipforge/shared";

export const PATCH = async (
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  const authResult = await requireUser();
  if ("error" in authResult) {
    return authResult.error;
  }

  const { id } = await params;
  const body = await parseJsonBody<unknown>(request);
  const parsed = updateScheduledPublishSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", parsed.error.message, 400);
  }

  const existing = await prisma.scheduledPublish.findUnique({ where: { id } });
  if (existing === null) {
    return apiError("NOT_FOUND", "Scheduled publish not found", 404);
  }

  const access = await requireWorkspaceEditor(
    authResult.userId,
    parsed.data.workspaceId,
  );
  if ("error" in access) {
    return access.error;
  }

  if (existing.workspaceId !== parsed.data.workspaceId) {
    return apiError("FORBIDDEN", "Not in workspace", 403);
  }

  if (parsed.data.status === "cancelled") {
    const updated = await prisma.scheduledPublish.update({
      where: { id },
      data: { status: ScheduledPublishStatus.cancelled },
    });
    return apiSuccess(updated);
  }

  const scheduledFor =
    parsed.data.scheduledFor !== undefined
      ? new Date(parsed.data.scheduledFor)
      : undefined;

  const updated = await prisma.scheduledPublish.update({
    where: { id },
    data: {
      scheduledFor,
      title: parsed.data.title,
      caption: parsed.data.caption,
      status:
        parsed.data.status === "scheduled"
          ? ScheduledPublishStatus.scheduled
          : undefined,
    },
  });

  return apiSuccess(updated);
};
