"use client";

import { SourceStatusBadge } from "@/components/sources/source-status-badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

type SourceRow = {
  id: string;
  title?: string | null;
  sourceUrl: string;
  status: string;
  createdAt: string;
};

const ACTIVE_STATUSES = new Set([
  "pending",
  "importing",
  "imported",
  "transcribing",
  "analyzing",
]);

type Props = {
  workspaceId: string;
};

export const RecentProjects = ({ workspaceId }: Props) => {
  const { data, isLoading } = useQuery({
    queryKey: ["sources", workspaceId],
    queryFn: async () => {
      const res = await fetch(`/api/sources?workspaceId=${workspaceId}`);
      const json = (await res.json()) as { data?: SourceRow[] };
      return json.data ?? [];
    },
    refetchInterval: (query) => {
      const sources = query.state.data ?? [];
      const hasActive = sources.some((s) => ACTIVE_STATUSES.has(s.status));
      return hasActive ? 3000 : false;
    },
  });

  return (
    <Card>
      <CardTitle>Recent projects</CardTitle>
      <CardDescription className="mb-4">
        Your latest source videos and import status.
      </CardDescription>
      {isLoading && <p className="text-sm text-muted">Loading…</p>}
      {!isLoading && (data?.length ?? 0) === 0 && (
        <p className="text-sm text-muted">
          No projects yet. Paste a URL above to get started.
        </p>
      )}
      <ul className="space-y-2">
        {data?.map((source) => (
          <li key={source.id}>
            <Link
              href={`/projects/${source.id}`}
              className="block rounded-lg border border-border bg-panel-2 px-3 py-2 text-sm hover:border-accent-cyan/50"
            >
              <span className="font-medium">
                {source.title ?? "Untitled source"}
              </span>
              <span className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted">
                <SourceStatusBadge status={source.status} />
                {new Date(source.createdAt).toLocaleDateString()}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
};
