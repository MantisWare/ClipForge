"use client";

import { ClipEditForm } from "@/components/clips/clip-edit-form";
import { Button } from "@/components/ui/button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";

export type ClipCandidateRow = {
  id: string;
  startMs: number;
  endMs: number;
  durationSeconds: number;
  transcriptExcerpt: string;
  hookScore: number;
  viralityScore: number;
  clarityScore: number;
  standaloneScore: number;
  platformFitScore: number;
  overallScore: number;
  reasonSelected: string;
  suggestedHook?: string | null;
  suggestedTitle?: string | null;
  suggestedCaption?: string | null;
  suggestedHashtags: string[];
  status: string;
};

type Props = {
  clip: ClipCandidateRow;
  workspaceId: string;
  sourceId: string;
  onSeek: (startMs: number) => void;
};

const formatMs = (ms: number): string => {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
};

export const ClipCandidateCard = ({
  clip,
  workspaceId,
  sourceId,
  onSeek,
}: Props) => {
  const [editing, setEditing] = useState(false);
  const queryClient = useQueryClient();
  const router = useRouter();
  const [captionStyleId, setCaptionStyleId] = useState<string>("");

  const stylesQuery = useQuery({
    queryKey: ["caption-styles", workspaceId],
    queryFn: async () => {
      const res = await fetch(
        `/api/caption-styles?workspaceId=${workspaceId}`,
      );
      const json = (await res.json()) as {
        data?: { id: string; name: string; isDefault: boolean }[];
      };
      return json.data ?? [];
    },
  });

  const actionMutation = useMutation({
    mutationFn: async (action: "approve" | "reject") => {
      const path =
        action === "approve"
          ? `/api/clips/${clip.id}/approve`
          : `/api/clips/${clip.id}/reject`;
      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId }),
      });
      const json = (await res.json()) as { error?: { message: string } };
      if (json.error !== undefined) {
        throw new Error(json.error.message);
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["candidates"] });
    },
  });

  const renderMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/clips/${clip.id}/render`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          captionStyleId:
            captionStyleId !== "" ? captionStyleId : undefined,
        }),
      });
      const json = (await res.json()) as {
        data?: { rendered?: { id: string } };
        error?: { message: string };
      };
      if (json.error !== undefined) {
        throw new Error(json.error.message);
      }
      return json.data?.rendered?.id;
    },
    onSuccess: (renderedId) => {
      if (renderedId !== undefined) {
        router.push(`/clips/${renderedId}/preview`);
      }
    },
  });

  return (
    <div
      className={`rounded-lg border px-3 py-3 text-sm ${
        clip.status === "approved"
          ? "border-success/50 bg-success/5"
          : clip.status === "rejected"
            ? "border-border bg-panel-2 opacity-60"
            : "border-border bg-panel-2"
      }`}
    >
      <button
        type="button"
        className="w-full text-left"
        onClick={() => onSeek(clip.startMs)}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-medium">
            {clip.suggestedTitle ?? "Untitled clip"}
          </span>
          <span className="font-mono text-xs text-muted">
            {formatMs(clip.startMs)} – {formatMs(clip.endMs)} ·{" "}
            {Math.round(clip.durationSeconds)}s
          </span>
        </div>
        <p className="mt-1 line-clamp-2 text-xs text-muted">
          {clip.transcriptExcerpt}
        </p>
      </button>

      <div className="mt-2 flex flex-wrap gap-2 text-xs">
        <ScorePill label="Overall" value={clip.overallScore} />
        <ScorePill label="Hook" value={clip.hookScore} />
        <ScorePill label="Standalone" value={clip.standaloneScore} />
        <ScorePill label="Retention" value={clip.viralityScore} />
        <ScorePill label="Platform" value={clip.platformFitScore} />
      </div>

      <p className="mt-2 text-xs text-muted">{clip.reasonSelected}</p>

      {clip.suggestedHook !== null &&
        clip.suggestedHook !== undefined &&
        clip.suggestedHook !== "" && (
          <p className="mt-1 text-xs">
            <span className="text-muted">Hook: </span>
            {clip.suggestedHook}
          </p>
        )}

      <div className="mt-3 flex flex-wrap gap-2">
        {clip.status === "candidate" && (
          <>
            <Button
              size="sm"
              onClick={() => actionMutation.mutate("approve")}
              disabled={actionMutation.isPending}
            >
              Approve
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => actionMutation.mutate("reject")}
              disabled={actionMutation.isPending}
            >
              Reject
            </Button>
          </>
        )}
        {clip.status === "approved" && (
          <>
            <span className="text-xs text-success">Approved</span>
            {(stylesQuery.data?.length ?? 0) > 0 && (
              <select
                className="h-8 rounded-lg border border-border bg-background px-2 text-xs"
                value={captionStyleId}
                onChange={(e) => setCaptionStyleId(e.target.value)}
                aria-label="Caption style"
              >
                <option value="">Default caption style</option>
                {stylesQuery.data?.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            )}
            <Button
              size="sm"
              onClick={() => renderMutation.mutate()}
              disabled={renderMutation.isPending}
            >
              {renderMutation.isPending ? "Rendering…" : "Render"}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() =>
                router.push(`/projects/${sourceId}/clips/${clip.id}`)
              }
            >
              Edit overlays
            </Button>
          </>
        )}
        {clip.status === "rendered" && (
          <span className="text-xs text-muted">Rendered</span>
        )}
        {clip.status === "rejected" && (
          <span className="text-xs text-muted">Rejected</span>
        )}
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setEditing((e) => !e)}
        >
          {editing ? "Hide edit" : "Edit"}
        </Button>
      </div>

      {editing && (
        <ClipEditForm
          clip={clip}
          workspaceId={workspaceId}
          onSaved={() => setEditing(false)}
        />
      )}

      {(actionMutation.isError || renderMutation.isError) && (
        <p className="mt-1 text-xs text-danger">
          {actionMutation.error?.message ?? renderMutation.error?.message}
        </p>
      )}
    </div>
  );
};

const ScorePill = ({ label, value }: { label: string; value: number }) => (
  <span className="rounded-full bg-panel px-2 py-0.5">
    {label}: {Math.round(value)}
  </span>
);
