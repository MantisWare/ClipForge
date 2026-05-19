"use client";

import {
  ClipCandidateCard,
  type ClipCandidateRow,
} from "@/components/clips/clip-candidate-card";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

type Props = {
  sourceId: string;
  workspaceId: string;
  sourceStatus: string;
  onSeek: (startMs: number) => void;
};

export const ClipCandidatesPanel = ({
  sourceId,
  workspaceId,
  sourceStatus,
  onSeek,
}: Props) => {
  const queryClient = useQueryClient();

  const candidatesQuery = useQuery({
    queryKey: ["candidates", sourceId],
    queryFn: async () => {
      const res = await fetch(`/api/sources/${sourceId}/candidates`);
      const json = (await res.json()) as { data?: ClipCandidateRow[] };
      return json.data ?? [];
    },
    refetchInterval: () =>
      sourceStatus === "analyzing" ? 3000 : false,
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/clips/generate-candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceVideoId: sourceId,
          workspaceId,
          clipCount: 10,
        }),
      });
      const json = (await res.json()) as { error?: { message: string } };
      if (json.error !== undefined) {
        throw new Error(json.error.message);
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["candidates", sourceId] });
      void queryClient.invalidateQueries({ queryKey: ["source", sourceId] });
      void queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
  });

  const candidates = candidatesQuery.data ?? [];
  const approvedCount = candidates.filter((c) => c.status === "approved").length;
  const canGenerate =
    sourceStatus === "ready" || sourceStatus === "failed";

  const batchRenderMutation = useMutation({
    mutationFn: async () => {
      const approvedIds = candidates
        .filter((c) => c.status === "approved")
        .map((c) => c.id);
      const res = await fetch("/api/clips/batch-render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, clipCandidateIds: approvedIds }),
      });
      const json = (await res.json()) as { error?: { message: string } };
      if (json.error !== undefined) {
        throw new Error(json.error.message);
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
  });

  return (
    <Card>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <CardTitle>Clip candidates</CardTitle>
          <CardDescription>
            AI-ranked short-form clip ideas from your transcript.
          </CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          {canGenerate && (
            <Button
              size="sm"
              onClick={() => generateMutation.mutate()}
              disabled={generateMutation.isPending}
            >
              {generateMutation.isPending ? "Generating…" : "Generate clips"}
            </Button>
          )}
          {approvedCount > 0 && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => batchRenderMutation.mutate()}
              disabled={batchRenderMutation.isPending}
            >
              {batchRenderMutation.isPending
                ? "Batch rendering…"
                : `Render ${approvedCount} approved`}
            </Button>
          )}
        </div>
      </div>

      {sourceStatus === "analyzing" && (
        <p className="mb-3 text-sm text-muted">
          Analyzing transcript and scoring clip windows…
        </p>
      )}

      {candidatesQuery.isLoading && (
        <p className="text-sm text-muted">Loading candidates…</p>
      )}

      {!candidatesQuery.isLoading &&
        candidates.length === 0 &&
        sourceStatus === "ready" && (
          <p className="text-sm text-muted">
            No candidates yet. Click Generate clips to create 5–10 ideas.
          </p>
        )}

      <ul className="space-y-3">
        {candidates.map((clip) => (
          <li key={clip.id}>
            <ClipCandidateCard
              clip={clip}
              workspaceId={workspaceId}
              sourceId={sourceId}
              onSeek={onSeek}
            />
          </li>
        ))}
      </ul>

      {generateMutation.isError && (
        <p className="mt-2 text-sm text-danger">
          {generateMutation.error.message}
        </p>
      )}
    </Card>
  );
};
