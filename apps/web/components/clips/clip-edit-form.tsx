"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

type ClipRow = {
  id: string;
  suggestedHook?: string | null;
  suggestedTitle?: string | null;
  suggestedCaption?: string | null;
  suggestedHashtags: string[];
};

type Props = {
  clip: ClipRow;
  workspaceId: string;
  onSaved?: () => void;
};

export const ClipEditForm = ({ clip, workspaceId, onSaved }: Props) => {
  const [hook, setHook] = useState(clip.suggestedHook ?? "");
  const [title, setTitle] = useState(clip.suggestedTitle ?? "");
  const [caption, setCaption] = useState(clip.suggestedCaption ?? "");
  const [hashtags, setHashtags] = useState(
    clip.suggestedHashtags.join(", "),
  );
  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/clips/${clip.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          suggestedHook: hook,
          suggestedTitle: title,
          suggestedCaption: caption,
          suggestedHashtags: hashtags
            .split(",")
            .map((t) => t.trim())
            .filter((t) => t !== ""),
        }),
      });
      const json = (await res.json()) as { error?: { message: string } };
      if (json.error !== undefined) {
        throw new Error(json.error.message);
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["candidates"],
      });
      onSaved?.();
    },
  });

  return (
    <div className="mt-3 space-y-2 border-t border-border pt-3">
      <Input
        placeholder="Hook"
        value={hook}
        onChange={(e) => setHook(e.target.value)}
        aria-label="Suggested hook"
      />
      <Input
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        aria-label="Suggested title"
      />
      <textarea
        className="flex min-h-[72px] w-full rounded-lg border border-border bg-panel-2 px-3 py-2 text-sm text-foreground placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        placeholder="Caption"
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        aria-label="Suggested caption"
      />
      <Input
        placeholder="Hashtags (comma-separated)"
        value={hashtags}
        onChange={(e) => setHashtags(e.target.value)}
        aria-label="Suggested hashtags"
      />
      <Button
        size="sm"
        variant="secondary"
        onClick={() => saveMutation.mutate()}
        disabled={saveMutation.isPending}
      >
        {saveMutation.isPending ? "Saving…" : "Save edits"}
      </Button>
      {saveMutation.isError && (
        <p className="text-xs text-danger">{saveMutation.error.message}</p>
      )}
    </div>
  );
};
