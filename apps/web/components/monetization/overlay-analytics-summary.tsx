"use client";

import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";

type Props = { workspaceId: string };

type AnalyticsRow = {
  slug: string;
  productTitle: string | null;
  impressions: number;
  clicks: number;
  ctr: number;
};

export const OverlayAnalyticsSummary = ({ workspaceId }: Props) => {
  const from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const to = new Date().toISOString();

  const query = useQuery({
    queryKey: ["overlay-analytics-summary", workspaceId],
    queryFn: async () => {
      const res = await fetch(
        `/api/analytics/overlays?workspaceId=${workspaceId}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
      );
      const json = (await res.json()) as {
        data?: { rows?: AnalyticsRow[]; totals?: { impressions: number; clicks: number } };
        error?: { message: string };
      };
      if (json.error !== undefined) {
        throw new Error(json.error.message);
      }
      return json.data;
    },
  });

  const totals = query.data?.totals;
  const topRows = (query.data?.rows ?? []).slice(0, 5);

  return (
    <Card>
      <CardTitle>Overlay link performance (30d)</CardTitle>
      <CardDescription className="mb-4">
        Tracked clicks via /r/[slug] redirects.
      </CardDescription>
      {query.isLoading && <p className="text-sm text-muted">Loading…</p>}
      {totals !== undefined && (
        <p className="mb-3 text-sm">
          <span className="font-medium">{totals.impressions}</span> impressions ·{" "}
          <span className="font-medium">{totals.clicks}</span> clicks
        </p>
      )}
      <ul className="space-y-2 text-sm">
        {topRows.map((row) => (
          <li
            key={row.slug}
            className="flex justify-between gap-2 rounded border border-border px-2 py-1"
          >
            <span className="truncate">{row.productTitle ?? row.slug}</span>
            <span className="shrink-0 text-muted">
              {row.clicks} clicks ({(row.ctr * 100).toFixed(1)}%)
            </span>
          </li>
        ))}
        {!query.isLoading && topRows.length === 0 && (
          <li className="text-muted">No overlay events yet.</li>
        )}
      </ul>
    </Card>
  );
};
