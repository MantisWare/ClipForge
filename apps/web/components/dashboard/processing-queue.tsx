"use client";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";

type JobRow = {
  id: string;
  type: string;
  status: string;
  createdAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
  errorMessage?: string | null;
};

const statusStyles: Record<string, string> = {
  queued: "text-accent-pink",
  running: "text-accent-cyan",
  completed: "text-success",
  failed: "text-danger",
  retrying: "text-warning",
  cancelled: "text-muted",
};

const formatDuration = (job: JobRow): string | null => {
  if (job.startedAt === null || job.startedAt === undefined) {
    return null;
  }
  const start = new Date(job.startedAt).getTime();
  const end =
    job.completedAt !== null && job.completedAt !== undefined
      ? new Date(job.completedAt).getTime()
      : Date.now();
  const seconds = Math.round((end - start) / 1000);
  if (seconds < 60) {
    return `${seconds}s`;
  }
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
};

type Props = {
  workspaceId: string;
};

export const ProcessingQueue = ({ workspaceId }: Props) => {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["jobs", workspaceId],
    queryFn: async () => {
      const res = await fetch(`/api/jobs?workspaceId=${workspaceId}`);
      const json = (await res.json()) as { data?: JobRow[] };
      return json.data ?? [];
    },
    refetchInterval: (query) => {
      const jobs = query.state.data ?? [];
      const hasActive = jobs.some(
        (j) => j.status === "queued" || j.status === "running",
      );
      return hasActive ? 2000 : 30000;
    },
  });

  const retryMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const res = await fetch(`/api/jobs/${jobId}/retry`, { method: "POST" });
      const json = (await res.json()) as { error?: { message: string } };
      if (json.error !== undefined) {
        throw new Error(json.error.message);
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["jobs", workspaceId] });
    },
  });

  const jobs = useMemo(() => data ?? [], [data]);

  return (
    <Card>
      <CardTitle>Processing queue</CardTitle>
      <CardDescription className="mb-4">
        Background jobs for import, transcription, and rendering.
      </CardDescription>
      {isLoading && <p className="text-sm text-muted">Loading…</p>}
      {!isLoading && jobs.length === 0 && (
        <p className="text-sm text-muted">No jobs yet.</p>
      )}
      <ul className="space-y-2">
        {jobs.map((job) => {
          const duration = formatDuration(job);
          return (
            <li
              key={job.id}
              className="rounded-lg border border-border bg-panel-2 px-3 py-2 text-sm"
            >
              <div className="flex items-center justify-between gap-2">
                <span>
                  <span className="font-medium">{job.type}</span>
                  {" — "}
                  <span
                    className={cn(
                      statusStyles[job.status] ?? "text-muted",
                    )}
                  >
                    {job.status}
                  </span>
                  {duration !== null && (
                    <span className="ml-2 text-xs text-muted">{duration}</span>
                  )}
                </span>
                <span className="shrink-0 text-xs text-muted">
                  {new Date(job.createdAt).toLocaleString()}
                </span>
              </div>
              {job.errorMessage !== null &&
                job.errorMessage !== undefined &&
                job.errorMessage !== "" && (
                  <p className="mt-1 text-xs text-danger">{job.errorMessage}</p>
                )}
              {job.status === "failed" && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="mt-2"
                  disabled={retryMutation.isPending}
                  onClick={() => retryMutation.mutate(job.id)}
                >
                  Retry
                </Button>
              )}
            </li>
          );
        })}
      </ul>
    </Card>
  );
};
