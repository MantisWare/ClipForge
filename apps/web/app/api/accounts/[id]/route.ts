import { apiError, apiSuccess } from "@/lib/api";
import { requireUser, requireWorkspaceEditor } from "@/lib/api-auth";
import { prisma, ConnectedAccountStatus } from "@clipforge/database";

export const DELETE = async (
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  const authResult = await requireUser();
  if ("error" in authResult) {
    return authResult.error;
  }

  const { id } = await params;
  const account = await prisma.connectedAccount.findUnique({
    where: { id },
  });
  if (account === null) {
    return apiError("NOT_FOUND", "Connected account not found", 404);
  }

  const access = await requireWorkspaceEditor(
    authResult.userId,
    account.workspaceId,
  );
  if ("error" in access) {
    return access.error;
  }

  await prisma.connectedAccount.update({
    where: { id },
    data: { status: ConnectedAccountStatus.revoked },
  });

  return apiSuccess({ disconnected: true });
};
