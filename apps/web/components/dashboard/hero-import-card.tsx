"use client";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

type ValidateResult = {
  sourceType: string;
  sourceUrl: string;
  title?: string;
  thumbnailUrl?: string;
  durationSeconds?: number;
};

type Props = {
  workspaceId: string;
};

export const HeroImportCard = ({ workspaceId }: Props) => {
  const [url, setUrl] = useState("");
  const queryClient = useQueryClient();

  const importMutation = useMutation({
    mutationFn: async () => {
      const validateRes = await fetch("/api/sources/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceUrl: url, workspaceId }),
      });
      const validateJson = (await validateRes.json()) as {
        data?: ValidateResult;
        error?: { message: string };
      };
      if (validateJson.error !== undefined) {
        throw new Error(validateJson.error.message);
      }

      const validated = validateJson.data as ValidateResult;

      const importRes = await fetch("/api/sources/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceUrl: url,
          workspaceId,
          sourceType: validated.sourceType,
          title: validated.title,
        }),
      });
      const importJson = (await importRes.json()) as {
        data?: { id: string };
        error?: { message: string };
      };
      if (importJson.error !== undefined) {
        throw new Error(importJson.error.message);
      }
      return importJson.data;
    },
    onSuccess: () => {
      setUrl("");
      void queryClient.invalidateQueries({ queryKey: ["sources"] });
      void queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
  });

  return (
    <Card>
      <CardTitle>Paste a video URL</CardTitle>
      <CardDescription className="mb-4">
        Supported: YouTube, Vimeo, direct MP4/MOV URLs, and file upload (via New
        Project).
      </CardDescription>
      <div className="flex gap-3">
        <Input
          placeholder="https://youtube.com/watch?v=..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          aria-label="Video URL"
        />
        <Button
          onClick={() => importMutation.mutate()}
          disabled={url === "" || importMutation.isPending}
        >
          {importMutation.isPending ? "Importing…" : "Import video"}
        </Button>
      </div>
      {importMutation.isError && (
        <p className="mt-2 text-sm text-danger">
          {importMutation.error.message}
        </p>
      )}
    </Card>
  );
};
