"use client";

import { ClipCandidatesPanel } from "@/components/clips/clip-candidates-panel";
import { SourceStatusBadge } from "@/components/sources/source-status-badge";
import { TranscriptViewer } from "@/components/sources/transcript-viewer";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef, useState } from "react";

type SourceDetail = {
  id: string;
  workspaceId: string;
  title?: string | null;
  sourceUrl: string;
  sourceType: string;
  status: string;
  durationSeconds?: number | null;
  width?: number | null;
  height?: number | null;
  thumbnailUrl?: string | null;
};

type PlaybackResponse = {
  status: string;
  playbackUrl: string | null;
  durationSeconds?: number | null;
};

type Props = {
  sourceId: string;
};

const POLL_STATUSES = new Set([
  "pending",
  "importing",
  "transcribing",
  "imported",
  "analyzing",
]);

const PLAYBACK_STATUSES = new Set([
  "imported",
  "importing",
  "transcribing",
  "ready",
  "analyzing",
]);

export const ProjectDetailClient = ({ sourceId }: Props) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentTimeMs, setCurrentTimeMs] = useState(0);
  const queryClient = useQueryClient();

  const sourceQuery = useQuery({
    queryKey: ["source", sourceId],
    queryFn: async () => {
      const res = await fetch(`/api/sources/${sourceId}`);
      const json = (await res.json()) as { data?: SourceDetail };
      return json.data;
    },
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status !== undefined && POLL_STATUSES.has(status)) {
        return 3000;
      }
      return false;
    },
  });

  const playbackQuery = useQuery({
    queryKey: ["playback", sourceId],
    queryFn: async () => {
      const res = await fetch(`/api/sources/${sourceId}/playback`);
      const json = (await res.json()) as { data?: PlaybackResponse };
      return json.data;
    },
    enabled:
      sourceQuery.data?.status !== undefined &&
      PLAYBACK_STATUSES.has(sourceQuery.data.status),
    refetchInterval: (query) => {
      if (query.state.data?.playbackUrl === null) {
        return 3000;
      }
      return false;
    },
  });

  const transcribeMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/sources/${sourceId}/transcribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const json = (await res.json()) as { error?: { message: string } };
      if (json.error !== undefined) {
        throw new Error(json.error.message);
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["source", sourceId] });
      void queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
  });

  const onTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (video !== null) {
      setCurrentTimeMs(Math.floor(video.currentTime * 1000));
    }
  }, []);

  const onSeek = useCallback((startMs: number) => {
    const video = videoRef.current;
    if (video !== null) {
      video.currentTime = startMs / 1000;
      void video.play().catch(() => undefined);
    }
  }, []);

  const source = sourceQuery.data;

  if (sourceQuery.isLoading) {
    return <p className="text-sm text-muted">Loading project…</p>;
  }

  if (source === undefined) {
    return <p className="text-sm text-danger">Project not found.</p>;
  }

  const playbackUrl = playbackQuery.data?.playbackUrl ?? null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold">
          {source.title ?? "Untitled source"}
        </h1>
        <SourceStatusBadge status={source.status} />
        {source.status === "imported" && (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => transcribeMutation.mutate()}
            disabled={transcribeMutation.isPending}
          >
            {transcribeMutation.isPending ? "Starting…" : "Start transcription"}
          </Button>
        )}
      </div>

      <Card>
        <CardTitle>Source preview</CardTitle>
        <CardDescription className="mb-4">
          {source.sourceType} · {source.sourceUrl}
        </CardDescription>

        {source.status === "failed" && (
          <p className="text-sm text-danger">
            Processing failed. Use Transcribe again or retry from the processing
            queue.
          </p>
        )}

        {(source.status === "pending" || source.status === "importing") && (
          <p className="text-sm text-muted">
            Downloading and storing source video…
          </p>
        )}

        {source.status === "transcribing" && (
          <p className="mb-4 text-sm text-muted">
            Extracting audio and transcribing…
          </p>
        )}

        {source.status === "analyzing" && (
          <p className="mb-4 text-sm text-muted">
            Generating clip candidates from transcript…
          </p>
        )}

        {playbackUrl !== null && (
          <video
            ref={videoRef}
            className="w-full max-w-3xl rounded-lg border border-border"
            controls
            src={playbackUrl}
            poster={source.thumbnailUrl ?? undefined}
            onTimeUpdate={onTimeUpdate}
          >
            <track kind="captions" />
          </video>
        )}

        {source.durationSeconds !== null &&
          source.durationSeconds !== undefined && (
            <p className="mt-2 text-xs text-muted">
              Duration: {Math.round(source.durationSeconds)}s
              {source.width !== null &&
                source.width !== undefined &&
                source.height !== null &&
                source.height !== undefined &&
                ` · ${source.width}×${source.height}`}
            </p>
          )}
      </Card>

      {(source.status === "transcribing" ||
        source.status === "ready" ||
        source.status === "imported" ||
        source.status === "analyzing" ||
        source.status === "failed") && (
        <TranscriptViewer
          sourceId={sourceId}
          sourceStatus={source.status}
          videoRef={videoRef}
          currentTimeMs={currentTimeMs}
        />
      )}

      {(source.status === "ready" ||
        source.status === "analyzing" ||
        source.status === "failed") && (
        <ClipCandidatesPanel
          sourceId={sourceId}
          workspaceId={source.workspaceId}
          sourceStatus={source.status}
          onSeek={onSeek}
        />
      )}
    </div>
  );
};
