import { apiSuccess } from "@/lib/api";
import { requireUser } from "@/lib/api-auth";
import { requireAdmin } from "@/lib/admin-auth";
import { JobStatus, prisma } from "@clipforge/database";

export const GET = async () => {
  const authResult = await requireUser();
  if ("error" in authResult) {
    return authResult.error;
  }

  const admin = requireAdmin(authResult.userId);
  if ("error" in admin) {
    return admin.error;
  }

  const [queued, running, failed, workspaces] = await Promise.all([
    prisma.job.count({ where: { status: JobStatus.queued } }),
    prisma.job.count({ where: { status: JobStatus.running } }),
    prisma.job.count({ where: { status: JobStatus.failed } }),
    prisma.workspace.count(),
  ]);

  return apiSuccess({
    jobs: { queued, running, failed },
    workspaces,
  });
};
