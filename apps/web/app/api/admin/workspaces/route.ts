import { apiSuccess } from "@/lib/api";
import { requireUser } from "@/lib/api-auth";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@clipforge/database";

export const GET = async () => {
  const authResult = await requireUser();
  if ("error" in authResult) {
    return authResult.error;
  }

  const admin = requireAdmin(authResult.userId);
  if ("error" in admin) {
    return admin.error;
  }

  const workspaces = await prisma.workspace.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      owner: { select: { email: true, name: true } },
      _count: {
        select: {
          sourceVideos: true,
          members: true,
        },
      },
    },
  });

  return apiSuccess(workspaces);
};
