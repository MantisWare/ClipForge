"use client";

import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";

type JobRow = {
  id: string;
  type: string;
  status: string;
  createdAt: string;
  errorMessage?: string | null;
};

type Props = {
  workspaceId: string;
};

export const ProcessingQueue = ({ workspaceId }: Props) => {
  const { data, isLoading } = useQuery({
    queryKey: ["jobs", workspaceId],
    queryFn: async () => {
      const res = await fetch(`/api/jobs?workspaceId=${workspaceId}`);
      const json = (await res.json()) as { data?: JobRow[] };
      return json.data ?? [];
    },
    refetchInterval: 5000,
  });

  return (
    <Card>
      <CardTitle>Processing queue</CardTitle>
      <CardDescription className="mb-4">
        Background jobs for import, transcription, and rendering.
      </CardDescription>
      {isLoading && <p className="text-sm text-muted">Loading…</p>}
      {!isLoading && (data?.length ?? 0) === 0 && (
        <p className="text-sm text-muted">No jobs yet.</p>
      )}
      <ul className="space-y-2">
        {data?.map((job) => (
          <li
            key={job.id}
            className="flex items-center justify-between rounded-lg border border-border bg-panel-2 px-3 py-2 text-sm"
          >
            <span>
              {job.type} — <span className="text-accent">{job.status}</span>
            </span>
            <span className="text-xs text-muted">
              {new Date(job.createdAt).toLocaleString()}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
};
