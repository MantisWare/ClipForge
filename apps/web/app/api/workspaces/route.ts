import { apiError, apiSuccess, parseJsonBody } from "@/lib/api";
import { requireUser } from "@/lib/api-auth";
import { getUserWorkspaces } from "@/lib/workspace";
import { prisma } from "@clipforge/database";
import { createWorkspaceSchema } from "@clipforge/shared";

export const GET = async () => {
  const authResult = await requireUser();
  if ("error" in authResult) {
    return authResult.error;
  }

  const workspaces = await getUserWorkspaces(authResult.userId);
  return apiSuccess(workspaces);
};

export const POST = async (request: Request) => {
  const authResult = await requireUser();
  if ("error" in authResult) {
    return authResult.error;
  }

  const body = await parseJsonBody<unknown>(request);
  const parsed = createWorkspaceSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", parsed.error.message, 400);
  }

  const workspace = await prisma.workspace.create({
    data: {
      name: parsed.data.name,
      ownerId: authResult.userId,
      members: {
        create: {
          userId: authResult.userId,
          role: "owner",
        },
      },
    },
  });

  return apiSuccess(workspace, 201);
};
