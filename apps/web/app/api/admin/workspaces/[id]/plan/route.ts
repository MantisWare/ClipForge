import { apiError, apiSuccess, parseJsonBody } from "@/lib/api";
import { requireUser } from "@/lib/api-auth";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma, WorkspacePlan } from "@clipforge/database";
import { z } from "zod";

const updatePlanSchema = z.object({
  plan: z.enum(["free", "creator", "agency", "enterprise"]),
});

export const PATCH = async (
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  const authResult = await requireUser();
  if ("error" in authResult) {
    return authResult.error;
  }

  const admin = requireAdmin(authResult.userId);
  if ("error" in admin) {
    return admin.error;
  }

  const { id } = await params;
  const body = await parseJsonBody<unknown>(request);
  const parsed = updatePlanSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", parsed.error.message, 400);
  }

  const planMap: Record<string, WorkspacePlan> = {
    free: WorkspacePlan.free,
    creator: WorkspacePlan.creator,
    agency: WorkspacePlan.agency,
    enterprise: WorkspacePlan.enterprise,
  };

  const updated = await prisma.workspace.update({
    where: { id },
    data: { plan: planMap[parsed.data.plan] },
  });

  return apiSuccess(updated);
};
