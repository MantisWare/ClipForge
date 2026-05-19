"use client";

import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";

type Overview = {
  periodDays: number;
  sources: { total: number; recent: number; ready: number };
  clips: { total: number; approved: number };
  renders: { ready: number; recent: number };
  publishing: {
    attempts: number;
    success: number;
    successRate: number | null;
  };
};

type Props = { workspaceId: string };

export const AnalyticsClient = ({ workspaceId }: Props) => {
  const query = useQuery({
    queryKey: ["analytics-overview", workspaceId],
    queryFn: async () => {
      const res = await fetch(
        `/api/analytics/overview?workspaceId=${workspaceId}&days=30`,
      );
      const json = (await res.json()) as { data?: Overview };
      return json.data;
    },
  });

  const data = query.data;

  if (query.isLoading) {
    return <p className="text-sm text-muted">Loading analytics…</p>;
  }

  if (data === undefined) {
    return <p className="text-sm text-muted">No analytics data.</p>;
  }

  const ratePct =
    data.publishing.successRate !== null
      ? `${Math.round(data.publishing.successRate * 100)}%`
      : "—";

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard label="Sources" value={String(data.sources.total)} sub={`${data.sources.recent} last 30d`} />
      <StatCard label="Clips approved" value={String(data.clips.approved)} sub={`${data.clips.total} total`} />
      <StatCard label="Renders ready" value={String(data.renders.ready)} sub={`${data.renders.recent} last 30d`} />
      <StatCard label="Publish success" value={ratePct} sub={`${data.publishing.success}/${data.publishing.attempts} attempts`} />
    </div>
  );
};

const StatCard = ({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) => (
  <Card>
    <CardDescription>{label}</CardDescription>
    <CardTitle className="text-2xl">{value}</CardTitle>
    <p className="mt-1 text-xs text-muted">{sub}</p>
  </Card>
);
