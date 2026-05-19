import { apiError, apiSuccess } from "@/lib/api";
import { requireUser, requireWorkspace } from "@/lib/api-auth";
import { isOverlaysEnabled, overlaysDisabledResponse } from "@/lib/overlay-feature";
import { prisma } from "@clipforge/database";

export const GET = async (request: Request) => {
  if (!isOverlaysEnabled()) {
    return overlaysDisabledResponse();
  }

  const authResult = await requireUser();
  if ("error" in authResult) {
    return authResult.error;
  }

  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (workspaceId === null || workspaceId === "") {
    return apiError("VALIDATION_ERROR", "workspaceId is required", 400);
  }

  const access = await requireWorkspace(authResult.userId, workspaceId);
  if ("error" in access) {
    return access.error;
  }

  const fromDate =
    from !== null && from !== ""
      ? new Date(from)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const toDate =
    to !== null && to !== "" ? new Date(to) : new Date();

  const slugs = await prisma.overlayLinkSlug.findMany({
    where: { workspaceId },
    include: {
      events: {
        where: {
          createdAt: { gte: fromDate, lte: toDate },
        },
      },
      productLink: { select: { title: true } },
    },
  });

  const rows = slugs.map((slug) => {
    const impressions = slug.events.filter((e) => e.type === "impression").length;
    const clicks = slug.events.filter((e) => e.type === "click").length;
    const ctr = impressions > 0 ? clicks / impressions : 0;
    return {
      slug: slug.slug,
      productTitle: slug.productLink?.title ?? null,
      impressions,
      clicks,
      ctr,
    };
  });

  const totals = rows.reduce(
    (acc, row) => ({
      impressions: acc.impressions + row.impressions,
      clicks: acc.clicks + row.clicks,
    }),
    { impressions: 0, clicks: 0 },
  );

  return apiSuccess({
    from: fromDate.toISOString(),
    to: toDate.toISOString(),
    totals: {
      ...totals,
      ctr:
        totals.impressions > 0 ? totals.clicks / totals.impressions : 0,
    },
    rows,
  });
};
