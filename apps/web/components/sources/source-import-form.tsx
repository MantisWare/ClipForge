"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { SourceRiskBanner } from "./source-risk-banner";

type ValidateResult = {
  sourceType: string;
  sourceUrl: string;
  title?: string;
  thumbnailUrl?: string | null;
  durationSeconds?: number | null;
  riskLevel?: string;
  rightsStatus?: string;
  riskHints?: string[];
};

type Props = {
  workspaceId: string;
  redirectOnSuccess?: boolean;
  showFileUpload?: boolean;
};

export const SourceImportForm = ({
  workspaceId,
  redirectOnSuccess = false,
  showFileUpload = true,
}: Props) => {
  const [url, setUrl] = useState("");
  const [validatedRisk, setValidatedRisk] = useState<ValidateResult | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const queryClient = useQueryClient();
  const router = useRouter();

  const invalidateSources = () => {
    void queryClient.invalidateQueries({ queryKey: ["sources"] });
    void queryClient.invalidateQueries({ queryKey: ["jobs"] });
  };

  const urlImportMutation = useMutation({
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
      setValidatedRisk(validated);

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
        data?: { source?: { id: string } };
        error?: { message: string };
      };
      if (importJson.error !== undefined) {
        throw new Error(importJson.error.message);
      }
      return importJson.data?.source?.id;
    },
    onSuccess: (sourceId) => {
      setUrl("");
      setValidatedRisk(null);
      invalidateSources();
      if (redirectOnSuccess && sourceId !== undefined) {
        router.push(`/projects/${sourceId}`);
      }
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const presignRes = await fetch("/api/sources/upload/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          filename: file.name,
          contentType: file.type !== "" ? file.type : "video/mp4",
        }),
      });
      const presignJson = (await presignRes.json()) as {
        data?: {
          sourceVideoId: string;
          storageKey: string;
          uploadUrl: string;
        };
        error?: { message: string };
      };
      if (presignJson.error !== undefined) {
        throw new Error(presignJson.error.message);
      }

      const { sourceVideoId, storageKey, uploadUrl } = presignJson.data as {
        sourceVideoId: string;
        storageKey: string;
        uploadUrl: string;
      };

      const putRes = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type !== "" ? file.type : "video/mp4",
        },
      });
      if (!putRes.ok) {
        throw new Error(`Upload failed (${putRes.status})`);
      }

      const completeRes = await fetch("/api/sources/upload/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          storageKey,
          title: file.name,
        }),
      });
      const completeJson = (await completeRes.json()) as {
        data?: { source?: { id: string } };
        error?: { message: string };
      };
      if (completeJson.error !== undefined) {
        throw new Error(completeJson.error.message);
      }

      return sourceVideoId;
    },
    onSuccess: (sourceId) => {
      setFileInputKey((k) => k + 1);
      invalidateSources();
      if (redirectOnSuccess && sourceId !== undefined) {
        router.push(`/projects/${sourceId}`);
      }
    },
  });

  const isPending =
    urlImportMutation.isPending || uploadMutation.isPending;

  const previewRisk = async () => {
    if (url === "") {
      return;
    }
    const validateRes = await fetch("/api/sources/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sourceUrl: url, workspaceId }),
    });
    const validateJson = (await validateRes.json()) as {
      data?: ValidateResult;
      error?: { message: string };
    };
    if (validateJson.data !== undefined) {
      setValidatedRisk(validateJson.data);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
        <Input
          className="min-w-0 flex-1"
          placeholder="https://youtube.com/watch?v=..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          aria-label="Video URL"
        />
        <div className="flex shrink-0 gap-2">
          <Button
            type="button"
            variant="secondary"
            className="whitespace-nowrap"
            onClick={() => void previewRisk()}
            disabled={url === "" || isPending}
          >
            Check rights
          </Button>
          <Button
            className="whitespace-nowrap"
            onClick={() => urlImportMutation.mutate()}
            disabled={url === "" || isPending}
          >
            {urlImportMutation.isPending ? "Importing…" : "Import URL"}
          </Button>
        </div>
      </div>

      {validatedRisk !== null && (
        <SourceRiskBanner
          riskLevel={validatedRisk.riskLevel}
          rightsStatus={validatedRisk.rightsStatus}
          hints={validatedRisk.riskHints}
        />
      )}

      {showFileUpload && (
        <div className="flex items-center gap-3">
          <Input
            key={fileInputKey}
            type="file"
            accept="video/mp4,video/quicktime,video/*"
            aria-label="Video file"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file !== undefined) {
                uploadMutation.mutate(file);
              }
            }}
            disabled={isPending}
          />
          {uploadMutation.isPending && (
            <span className="text-sm text-muted">Uploading…</span>
          )}
        </div>
      )}

      {(urlImportMutation.isError || uploadMutation.isError) && (
        <p className="text-sm text-danger">
          {urlImportMutation.error?.message ??
            uploadMutation.error?.message}
        </p>
      )}
    </div>
  );
};
