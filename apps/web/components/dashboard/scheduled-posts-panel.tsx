"use client";

import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

type ScheduledRow = {
  id: string;
  platform: string;
  scheduledFor: string;
  status: string;
  renderedClip?: {
    clipCandidate?: { suggestedTitle?: string | null };
  };
};

type Props = { workspaceId: string };

export const ScheduledPostsPanel = ({ workspaceId }: Props) => {
  const from = new Date().toISOString();
  const to = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

  const query = useQuery({
    queryKey: ["dashboard-scheduled", workspaceId],
    queryFn: async () => {
      const res = await fetch(
        `/api/calendar?workspaceId=${workspaceId}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
      );
      const json = (await res.json()) as {
        data?: { scheduled?: ScheduledRow[] };
      };
      return json.data?.scheduled ?? [];
    },
  });

  const upcoming = (query.data ?? []).filter(
    (row) => row.status === "scheduled",
  );

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between gap-2">
        <CardTitle>Scheduled posts</CardTitle>
        <Link
          href="/calendar"
          className="text-sm text-accent-cyan hover:underline"
        >
          Open calendar
        </Link>
      </div>
      <CardDescription className="mb-4">
        Upcoming publishes in the next 14 days.
      </CardDescription>
      {query.isLoading && (
        <p className="text-sm text-muted">Loading schedule…</p>
      )}
      {!query.isLoading && upcoming.length === 0 && (
        <p className="text-sm text-muted">No scheduled posts yet.</p>
      )}
      <ul className="space-y-2 text-sm">
        {upcoming.slice(0, 5).map((row) => (
          <li
            key={row.id}
            className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2"
          >
            <span className="truncate">
              {row.renderedClip?.clipCandidate?.suggestedTitle ?? row.platform}
            </span>
            <span className="shrink-0 text-xs text-muted">
              {new Date(row.scheduledFor).toLocaleString()}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
};
