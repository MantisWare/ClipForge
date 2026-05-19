"use client";

import { SourceStatusBadge } from "@/components/sources/source-status-badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

type SourceRow = {
  id: string;
  title?: string | null;
  status: string;
  sourceType: string;
  createdAt: string;
  clipCount: number;
  hasTranscript: boolean;
};

type Props = { workspaceId: string };

export const ProjectsListClient = ({ workspaceId }: Props) => {
  const query = useQuery({
    queryKey: ["analytics-sources", workspaceId],
    queryFn: async () => {
      const res = await fetch(
        `/api/analytics/sources?workspaceId=${workspaceId}`,
      );
      const json = (await res.json()) as { data?: SourceRow[] };
      return json.data ?? [];
    },
  });

  const sources = query.data ?? [];

  return (
    <div className="space-y-4">
      {query.isLoading && <p className="text-sm text-muted">Loading projects…</p>}
      {sources.length === 0 && !query.isLoading && (
        <Card>
          <CardTitle>No projects yet</CardTitle>
          <CardDescription>
            <Link href="/projects/new" className="text-brand underline">
              Import a video
            </Link>{" "}
            to start repurposing.
          </CardDescription>
        </Card>
      )}
      <ul className="space-y-3">
        {sources.map((source) => (
          <li key={source.id}>
            <Link href={`/projects/${source.id}`}>
              <Card className="transition hover:border-brand/40">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">
                      {source.title ?? "Untitled source"}
                    </CardTitle>
                    <CardDescription>
                      {source.sourceType} · {source.clipCount} clips
                      {source.hasTranscript ? " · transcript" : ""}
                    </CardDescription>
                  </div>
                  <SourceStatusBadge status={source.status} />
                </div>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};
