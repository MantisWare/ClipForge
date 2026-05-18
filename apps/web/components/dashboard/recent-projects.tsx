"use client";

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
              className="block rounded-lg border border-border bg-panel-2 px-3 py-2 text-sm hover:border-accent"
            >
              <span className="font-medium">
                {source.title ?? "Untitled source"}
              </span>
              <span className="mt-1 block text-xs text-muted">
                {source.status} · {new Date(source.createdAt).toLocaleDateString()}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
};
