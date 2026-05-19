"use client";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";

type TranscriptWord = {
  id: string;
  word: string;
  startMs: number;
  endMs: number;
};

type TranscriptSegment = {
  id: string;
  startMs: number;
  endMs: number;
  text: string;
  words: TranscriptWord[];
};

type TranscriptResponse = {
  language?: string | null;
  status: string;
  segments: TranscriptSegment[];
};

type Props = {
  sourceId: string;
  sourceStatus: string;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  currentTimeMs: number;
};

export const TranscriptViewer = ({
  sourceId,
  sourceStatus,
  videoRef,
  currentTimeMs,
}: Props) => {
  const queryClient = useQueryClient();
  const listRef = useRef<HTMLDivElement>(null);
  const [activeSegmentId, setActiveSegmentId] = useState<string | null>(null);

  const transcriptQuery = useQuery({
    queryKey: ["transcript", sourceId],
    queryFn: async () => {
      const res = await fetch(`/api/sources/${sourceId}/transcript`);
      const json = (await res.json()) as { data?: TranscriptResponse };
      return json.data;
    },
    refetchInterval: () =>
      sourceStatus === "transcribing" ? 3000 : false,
  });

  const retryMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/sources/${sourceId}/transcribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force: true }),
      });
      const json = (await res.json()) as { error?: { message: string } };
      if (json.error !== undefined) {
        throw new Error(json.error.message);
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["transcript", sourceId] });
      void queryClient.invalidateQueries({ queryKey: ["source", sourceId] });
      void queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
  });

  const segments = transcriptQuery.data?.segments ?? [];

  useEffect(() => {
    const active = segments.find(
      (s) => currentTimeMs >= s.startMs && currentTimeMs < s.endMs,
    );
    setActiveSegmentId(active?.id ?? null);
  }, [currentTimeMs, segments]);

  useEffect(() => {
    if (activeSegmentId === null || listRef.current === null) {
      return;
    }
    const el = listRef.current.querySelector(
      `[data-segment-id="${activeSegmentId}"]`,
    );
    if (el !== null) {
      el.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [activeSegmentId]);

  const seekTo = useCallback(
    (startMs: number) => {
      const video = videoRef.current;
      if (video !== null) {
        video.currentTime = startMs / 1000;
      }
    },
    [videoRef],
  );

  return (
    <Card>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <CardTitle>Transcript</CardTitle>
          <CardDescription>
            {transcriptQuery.data?.language !== null &&
            transcriptQuery.data?.language !== undefined
              ? `Language: ${transcriptQuery.data.language}`
              : "Word-level timestamps synced to playback"}
          </CardDescription>
        </div>
        {(sourceStatus === "ready" ||
          sourceStatus === "failed" ||
          sourceStatus === "imported") && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => retryMutation.mutate()}
            disabled={retryMutation.isPending}
          >
            {retryMutation.isPending ? "Queuing…" : "Transcribe again"}
          </Button>
        )}
      </div>

      {sourceStatus === "transcribing" && segments.length === 0 && (
        <p className="text-sm text-muted">Transcribing audio…</p>
      )}

      {transcriptQuery.isLoading && (
        <p className="text-sm text-muted">Loading transcript…</p>
      )}

      {segments.length === 0 &&
        sourceStatus === "ready" &&
        !transcriptQuery.isLoading && (
          <p className="text-sm text-muted">No transcript segments found.</p>
        )}

      {segments.length === 0 &&
        sourceStatus === "imported" &&
        !transcriptQuery.isLoading && (
          <p className="text-sm text-muted">
            Waiting for transcription to start…
          </p>
        )}

      <div
        ref={listRef}
        className="max-h-96 space-y-2 overflow-y-auto pr-1"
      >
        {segments.map((segment) => {
          const isActive = segment.id === activeSegmentId;
          return (
            <button
              key={segment.id}
              type="button"
              data-segment-id={segment.id}
              onClick={() => seekTo(segment.startMs)}
              className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                isActive
                  ? "border-accent-cyan/60 bg-accent-cyan/10"
                  : "border-border bg-panel-2 hover:border-accent-cyan/30"
              }`}
            >
              <span className="mb-1 block font-mono text-xs text-muted">
                {formatMs(segment.startMs)} – {formatMs(segment.endMs)}
              </span>
              <span>
                {segment.words.length > 0
                  ? segment.words.map((w) => {
                      const wordActive =
                        currentTimeMs >= w.startMs && currentTimeMs < w.endMs;
                      return (
                        <span
                          key={w.id}
                          className={
                            wordActive
                              ? "rounded bg-brand-pink/30 px-0.5"
                              : undefined
                          }
                        >
                          {w.word}{" "}
                        </span>
                      );
                    })
                  : segment.text}
              </span>
            </button>
          );
        })}
      </div>

      {retryMutation.isError && (
        <p className="mt-2 text-sm text-danger">
          {retryMutation.error.message}
        </p>
      )}
    </Card>
  );
};

const formatMs = (ms: number): string => {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
};
