"use client";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useMutation, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";

type RenderedDetail = {
  id: string;
  status: string;
  workspaceId: string;
  playbackUrl: string | null;
  renderVariant?: string;
  cleanStorageKey?: string | null;
  clipCandidate?: {
    id: string;
    suggestedTitle?: string | null;
    suggestedCaption?: string | null;
    suggestedHashtags: string[];
  };
};

type AccountRow = {
  id: string;
  platform: string;
  accountName: string;
  status: string;
};

type Props = {
  renderedId: string;
};

export const RenderPreviewClient = ({ renderedId }: Props) => {
  const renderedQuery = useQuery({
    queryKey: ["rendered", renderedId],
    queryFn: async () => {
      const res = await fetch(`/api/rendered/${renderedId}`);
      const json = (await res.json()) as { data?: RenderedDetail };
      return json.data;
    },
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === "queued" || status === "rendering") {
        return 3000;
      }
      return false;
    },
  });

  const publishMetadataQuery = useQuery({
    queryKey: ["publish-metadata", renderedId, renderedQuery.data?.workspaceId],
    queryFn: async () => {
      const ws = renderedQuery.data?.workspaceId;
      if (ws === undefined) return null;
      const res = await fetch(
        `/api/rendered/${renderedId}/publish-metadata?workspaceId=${ws}`,
      );
      const json = (await res.json()) as {
        data?: {
          description: string;
          linksText: string;
          sourceVideoId: string;
          clipCandidateId: string;
        };
      };
      return json.data ?? null;
    },
    enabled:
      renderedQuery.data?.workspaceId !== undefined &&
      renderedQuery.data?.status === "ready",
  });

  const accountsQuery = useQuery({
    queryKey: ["accounts", renderedQuery.data?.workspaceId],
    queryFn: async () => {
      const ws = renderedQuery.data?.workspaceId;
      if (ws === undefined) {
        return [];
      }
      const res = await fetch(`/api/accounts?workspaceId=${ws}`);
      const json = (await res.json()) as { data?: AccountRow[] };
      return json.data ?? [];
    },
    enabled: renderedQuery.data?.workspaceId !== undefined,
  });

  const downloadMutation = useMutation({
    mutationFn: async (variant?: "clean" | "monetized") => {
      const qs =
        variant !== undefined ? `?variant=${variant}` : "";
      const res = await fetch(`/api/rendered/${renderedId}/download${qs}`);
      const json = (await res.json()) as {
        data?: { downloadUrl: string };
        error?: { message: string };
      };
      if (json.error !== undefined) {
        throw new Error(json.error.message);
      }
      if (json.data?.downloadUrl !== undefined) {
        window.open(json.data.downloadUrl, "_blank");
      }
    },
  });

  const exportPackageMutation = useMutation({
    mutationFn: async () => {
      const rendered = renderedQuery.data;
      if (rendered === undefined) return;
      const res = await fetch(
        `/api/rendered/${renderedId}/export-package`,
      );
      const json = (await res.json()) as {
        data?: {
          files: Record<string, { url: string } | null>;
          linksText: string;
        };
        error?: { message: string };
      };
      if (json.error !== undefined) throw new Error(json.error.message);
      const monetized = json.data?.files.monetized?.url;
      if (monetized !== undefined) window.open(monetized, "_blank");
      if (
        json.data?.linksText !== undefined &&
        json.data.linksText !== ""
      ) {
        await navigator.clipboard.writeText(json.data.linksText);
      }
    },
  });

  const publishMutation = useMutation({
    mutationFn: async (form: {
      title: string;
      caption: string;
      accountId: string;
    }) => {
      const rendered = renderedQuery.data;
      if (rendered === undefined) {
        throw new Error("Rendered clip not loaded");
      }
      const res = await fetch("/api/publish/youtube", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          renderedClipId: renderedId,
          workspaceId: rendered.workspaceId,
          connectedAccountId: form.accountId,
          title: form.title,
          caption: form.caption,
          visibility: "public",
        }),
      });
      const json = (await res.json()) as { error?: { message: string } };
      if (json.error !== undefined) {
        throw new Error(json.error.message);
      }
    },
  });

  const rendered = renderedQuery.data;
  const youtubeAccount = accountsQuery.data?.find(
    (a) => a.platform === "youtube" && a.status === "connected",
  );

  if (renderedQuery.isLoading) {
    return <p className="text-sm text-muted">Loading preview…</p>;
  }

  if (rendered === undefined) {
    return <p className="text-sm text-danger">Rendered clip not found.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold">
          {rendered.clipCandidate?.suggestedTitle ?? "Render preview"}
        </h1>
        <span className="text-sm text-muted">{rendered.status}</span>
      </div>

      <Card>
        <CardTitle>Preview</CardTitle>
        <CardDescription className="mb-4">1080×1920 vertical output</CardDescription>
        {rendered.status === "rendering" && (
          <p className="text-sm text-muted">Rendering in progress…</p>
        )}
        {rendered.playbackUrl !== null && (
          <video
            className="mx-auto max-h-[70vh] rounded-lg border border-border"
            controls
            src={rendered.playbackUrl}
          />
        )}
      </Card>

      {rendered.status === "ready" && (
        <Card>
          <CardTitle>Export and publish</CardTitle>
          <CardDescription className="mb-4">
            Download the MP4 or publish to a connected YouTube channel.
          </CardDescription>
          <div className="flex flex-wrap gap-2 mb-4">
            <Button
              variant="secondary"
              onClick={() => downloadMutation.mutate(undefined)}
              disabled={downloadMutation.isPending}
            >
              Download (playback)
            </Button>
            {rendered.cleanStorageKey !== null &&
              rendered.cleanStorageKey !== undefined && (
                <Button
                  variant="secondary"
                  onClick={() => downloadMutation.mutate("clean")}
                  disabled={downloadMutation.isPending}
                >
                  Download clean
                </Button>
              )}
            {rendered.renderVariant === "monetized" && (
              <Button
                variant="secondary"
                onClick={() => downloadMutation.mutate("monetized")}
                disabled={downloadMutation.isPending}
              >
                Download with overlays
              </Button>
            )}
            <Button
              variant="ghost"
              onClick={() => exportPackageMutation.mutate()}
              disabled={exportPackageMutation.isPending}
            >
              Export package
            </Button>
            <Link
              href="/accounts"
              className="inline-flex h-10 items-center rounded-lg px-4 text-sm text-muted hover:text-foreground"
            >
              Manage accounts
            </Link>
            <Link
              href={`/calendar?renderedClipId=${renderedId}`}
              className="inline-flex h-10 items-center rounded-lg px-4 text-sm text-muted hover:text-foreground"
            >
              Schedule publish
            </Link>
            {publishMetadataQuery.data !== undefined &&
              publishMetadataQuery.data !== null && (
                <Link
                  href={`/projects/${publishMetadataQuery.data.sourceVideoId}/clips/${publishMetadataQuery.data.clipCandidateId}`}
                  className="inline-flex h-10 items-center rounded-lg px-4 text-sm text-muted hover:text-foreground"
                >
                  Edit overlays
                </Link>
              )}
          </div>
          <PublishJobsPanel workspaceId={rendered.workspaceId} />
          {youtubeAccount !== undefined ? (
            <PublishForm
              defaultTitle={rendered.clipCandidate?.suggestedTitle ?? ""}
              defaultCaption={
                publishMetadataQuery.data?.description ??
                rendered.clipCandidate?.suggestedCaption ??
                ""
              }
              linksText={publishMetadataQuery.data?.linksText ?? ""}
              accountId={youtubeAccount.id}
              requireDisclosure={rendered.renderVariant === "monetized"}
              onPublish={(form) => publishMutation.mutate(form)}
              isPending={publishMutation.isPending}
            />
          ) : (
            <p className="text-sm text-muted">
              Connect YouTube on the{" "}
              <Link href="/accounts" className="text-accent-cyan underline">
                accounts page
              </Link>{" "}
              to publish directly.
            </p>
          )}
          {publishMutation.isError && (
            <p className="mt-2 text-sm text-danger">
              {publishMutation.error.message}
            </p>
          )}
          {publishMutation.isSuccess && (
            <p className="mt-2 text-sm text-success">
              Publish job queued. Check the processing queue for status.
            </p>
          )}
        </Card>
      )}
    </div>
  );
};

const PublishJobsPanel = ({ workspaceId }: { workspaceId: string }) => {
  const jobsQuery = useQuery({
    queryKey: ["publish-jobs", workspaceId],
    queryFn: async () => {
      const res = await fetch(
        `/api/publish/jobs?workspaceId=${workspaceId}`,
      );
      const json = (await res.json()) as {
        data?: { id: string; status: string; platform: string; createdAt: string }[];
      };
      return (json.data ?? []).slice(0, 5);
    },
    refetchInterval: 5000,
  });

  const jobs = jobsQuery.data ?? [];
  if (jobs.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 rounded-lg border border-border p-3 text-sm">
      <p className="mb-2 font-medium">Recent publish jobs</p>
      <ul className="space-y-1 text-muted">
        {jobs.map((job) => (
          <li key={job.id}>
            {job.platform} · {job.status} ·{" "}
            {new Date(job.createdAt).toLocaleString()}
          </li>
        ))}
      </ul>
    </div>
  );
};

const PublishForm = ({
  defaultTitle,
  defaultCaption,
  linksText,
  accountId,
  requireDisclosure,
  onPublish,
  isPending,
}: {
  defaultTitle: string;
  defaultCaption: string;
  linksText: string;
  accountId: string;
  requireDisclosure: boolean;
  onPublish: (form: {
    title: string;
    caption: string;
    accountId: string;
  }) => void;
  isPending: boolean;
}) => {
  const [title, setTitle] = useState(defaultTitle);
  const [caption, setCaption] = useState(defaultCaption);
  const [disclosureConfirmed, setDisclosureConfirmed] = useState(false);

  const canPublish =
    !isPending && (!requireDisclosure || disclosureConfirmed);

  return (
    <div className="space-y-2">
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="YouTube title"
        aria-label="Publish title"
      />
      <textarea
        className="flex min-h-[120px] w-full rounded-lg border border-border bg-panel-2 px-3 py-2 text-sm"
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        placeholder="Description (includes affiliate links when overlays are present)"
        aria-label="Publish caption"
      />
      {linksText !== "" && (
        <p className="text-xs text-muted">
          Affiliate links block is included in the description above.
        </p>
      )}
      {requireDisclosure && (
        <label className="flex items-start gap-2 text-sm text-muted">
          <input
            type="checkbox"
            checked={disclosureConfirmed}
            onChange={(e) => setDisclosureConfirmed(e.target.checked)}
            className="mt-1"
          />
          <span>
            I confirm this video includes paid promotion or affiliate links and
            required disclosures are in the description.
          </span>
        </label>
      )}
      <p className="text-xs text-muted">
        YouTube: add #ad or partnership language in the description. TikTok /
        Instagram: use branded content tools where available.
      </p>
      <Button
        onClick={() => onPublish({ title, caption, accountId })}
        disabled={!canPublish}
      >
        {isPending ? "Publishing…" : "Publish to YouTube"}
      </Button>
    </div>
  );
};
