"use client";

import { ClipOverlayEditor } from "@/components/overlays/clip-overlay-editor";
import { ClipEditForm } from "@/components/clips/clip-edit-form";
import type { ClipCandidateRow } from "@/components/clips/clip-candidate-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  sourceId: string;
  clipId: string;
  workspaceId: string;
  initialClip: ClipCandidateRow;
};

export const ClipDetailClient = ({
  sourceId,
  clipId,
  workspaceId,
  initialClip,
}: Props) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"review" | "overlays" | "render">("review");
  const [captionStyleId, setCaptionStyleId] = useState("");
  const [includeOverlays, setIncludeOverlays] = useState(false);

  const clipQuery = useQuery({
    queryKey: ["clip", clipId],
    queryFn: async () => {
      const res = await fetch(`/api/clips/${clipId}`);
      const json = (await res.json()) as {
        data?: ClipCandidateRow & { startMs: number; endMs: number };
      };
      return json.data ?? initialClip;
    },
    initialData: initialClip,
  });

  const stylesQuery = useQuery({
    queryKey: ["caption-styles", workspaceId],
    queryFn: async () => {
      const res = await fetch(
        `/api/caption-styles?workspaceId=${workspaceId}`,
      );
      const json = (await res.json()) as {
        data?: { id: string; name: string }[];
      };
      return json.data ?? [];
    },
  });

  const renderMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/clips/${clipId}/render`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          captionStyleId: captionStyleId !== "" ? captionStyleId : undefined,
          includeOverlays,
        }),
      });
      const json = (await res.json()) as {
        data?: { rendered?: { id: string } };
        error?: { message: string };
      };
      if (json.error !== undefined) throw new Error(json.error.message);
      return json.data?.rendered?.id;
    },
    onSuccess: (rid) => {
      if (rid !== undefined) router.push(`/clips/${rid}/preview`);
    },
  });

  const clip = clipQuery.data;
  const clipDurationMs = clip.endMs - clip.startMs;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/projects/${sourceId}`)}
        >
          Back to project
        </Button>
        <nav className="flex gap-2 text-sm">
          {(["review", "overlays", "render"] as const).map((t) => (
            <button
              key={t}
              type="button"
              className={`rounded-lg px-3 py-1 capitalize ${
                tab === t ? "bg-panel-2 text-foreground" : "text-muted"
              }`}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </nav>
      </div>

      <div>
        <h1 className="text-2xl font-semibold">
          {clip.suggestedTitle ?? "Clip"}
        </h1>
        <p className="text-sm text-muted">{clip.status}</p>
      </div>

      {tab === "review" && (
        <Card className="space-y-4 p-4">
          <p className="text-sm text-muted">{clip.transcriptExcerpt}</p>
          <ClipEditForm
            clip={clip}
            workspaceId={workspaceId}
            onSaved={() =>
              void queryClient.invalidateQueries({ queryKey: ["clip", clipId] })
            }
          />
        </Card>
      )}

      {tab === "overlays" &&
        (clip.status === "approved" || clip.status === "rendered") && (
        <ClipOverlayEditor
          clipId={clipId}
          sourceId={sourceId}
          workspaceId={workspaceId}
          clipDurationMs={clipDurationMs}
          suggestedHook={clip.suggestedHook}
        />
      )}

      {tab === "overlays" &&
        clip.status !== "approved" &&
        clip.status !== "rendered" && (
        <p className="text-sm text-muted">Approve the clip to edit overlays.</p>
      )}

      {tab === "render" &&
        (clip.status === "approved" || clip.status === "rendered") && (
        <Card className="space-y-4 p-4">
          {clip.status === "rendered" && (
            <p className="text-sm text-muted">
              Re-rendering creates a new output and replaces the previous render
              for this clip.
            </p>
          )}
          {(stylesQuery.data?.length ?? 0) > 0 && (
            <label className="block text-xs text-muted">
              Caption style
              <select
                className="mt-1 flex h-9 w-full max-w-xs rounded-lg border border-border bg-background px-2 text-sm"
                value={captionStyleId}
                onChange={(e) => setCaptionStyleId(e.target.value)}
              >
                <option value="">Default caption style</option>
                {stylesQuery.data?.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={includeOverlays}
              onChange={(e) => setIncludeOverlays(e.target.checked)}
            />
            Include monetization overlays (non-draft only)
          </label>
          <Button
            onClick={() => renderMutation.mutate()}
            disabled={renderMutation.isPending}
          >
            {renderMutation.isPending ? "Starting…" : "Start render"}
          </Button>
          {renderMutation.isError && (
            <p className="text-sm text-danger">{renderMutation.error.message}</p>
          )}
        </Card>
      )}

      {tab === "render" &&
        clip.status !== "approved" &&
        clip.status !== "rendered" && (
        <p className="text-sm text-muted">Approve the clip to render.</p>
      )}
    </div>
  );
};
