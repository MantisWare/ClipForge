"use client";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";

type ScheduledRow = {
  id: string;
  platform: string;
  scheduledFor: string;
  status: string;
  renderedClip?: { clipCandidate?: { suggestedTitle?: string | null } };
};

type RenderedRow = {
  id: string;
  status: string;
  clipCandidate?: { suggestedTitle?: string | null };
};

type AccountRow = {
  id: string;
  platform: string;
  accountName: string;
  status: string;
};

type Props = { workspaceId: string; renderedClipId?: string };

export const CalendarClient = ({ workspaceId, renderedClipId }: Props) => {
  const queryClient = useQueryClient();
  const [selectedRenderedId, setSelectedRenderedId] = useState(
    renderedClipId ?? "",
  );
  const [connectedAccountId, setConnectedAccountId] = useState("");
  const [scheduledFor, setScheduledFor] = useState("");
  const [title, setTitle] = useState("");

  const activeRenderedId =
    renderedClipId !== undefined && renderedClipId !== ""
      ? renderedClipId
      : selectedRenderedId;

  const accountsQuery = useQuery({
    queryKey: ["accounts", workspaceId],
    queryFn: async () => {
      const res = await fetch(`/api/accounts?workspaceId=${workspaceId}`);
      const json = (await res.json()) as { data?: AccountRow[] };
      return json.data ?? [];
    },
  });

  const renderedQuery = useQuery({
    queryKey: ["rendered-list", workspaceId],
    queryFn: async () => {
      const res = await fetch(`/api/rendered?workspaceId=${workspaceId}`);
      const json = (await res.json()) as { data?: RenderedRow[] };
      return (json.data ?? []).filter((r) => r.status === "ready");
    },
  });

  const calendarQuery = useQuery({
    queryKey: ["calendar", workspaceId],
    queryFn: async () => {
      const res = await fetch(`/api/calendar?workspaceId=${workspaceId}`);
      const json = (await res.json()) as { data?: { scheduled?: ScheduledRow[] } };
      return json.data?.scheduled ?? [];
    },
  });

  const youtubeAccounts =
    accountsQuery.data?.filter(
      (a) => a.platform === "youtube" && a.status === "connected",
    ) ?? [];

  const scheduleMutation = useMutation({
    mutationFn: async () => {
      if (activeRenderedId === "") {
        throw new Error("Select a rendered clip to schedule");
      }
      if (connectedAccountId === "") {
        throw new Error("Select a connected YouTube account");
      }
      const res = await fetch("/api/scheduled-publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          renderedClipId: activeRenderedId,
          connectedAccountId,
          platform: "youtube",
          title: title !== "" ? title : undefined,
          scheduledFor: new Date(scheduledFor).toISOString(),
        }),
      });
      const json = (await res.json()) as { error?: { message: string } };
      if (json.error !== undefined) throw new Error(json.error.message);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["calendar", workspaceId] });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/scheduled-publish/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, status: "cancelled" }),
      });
      const json = (await res.json()) as { error?: { message: string } };
      if (json.error !== undefined) throw new Error(json.error.message);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["calendar", workspaceId] });
    },
  });

  const items = calendarQuery.data ?? [];

  return (
    <div className="space-y-6">
      <Card>
        <CardTitle>Schedule YouTube publish</CardTitle>
        <CardDescription className="mb-3">
          Description includes affiliate links from overlays automatically.
        </CardDescription>
        {renderedClipId === undefined && (
          <label className="mb-3 block text-sm text-muted">
            Rendered clip
            <select
              className="mt-1 block w-full max-w-md rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
              value={selectedRenderedId}
              onChange={(e) => setSelectedRenderedId(e.target.value)}
            >
              <option value="">Select a ready render…</option>
              {(renderedQuery.data ?? []).map((r) => (
                <option key={r.id} value={r.id}>
                  {r.clipCandidate?.suggestedTitle ?? r.id.slice(0, 8)}
                </option>
              ))}
            </select>
          </label>
        )}
        {renderedClipId !== undefined && (
          <p className="mb-3 text-sm text-muted">
            Scheduling clip from render preview.{" "}
            <Link
              href={`/clips/${renderedClipId}/preview`}
              className="text-accent-cyan hover:underline"
            >
              Back to preview
            </Link>
          </p>
        )}
        <label className="mb-3 block text-sm text-muted">
          YouTube account
          <select
            className="mt-1 block w-full max-w-md rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
            value={connectedAccountId}
            onChange={(e) => setConnectedAccountId(e.target.value)}
          >
            <option value="">Select account…</option>
            {youtubeAccounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.accountName}
              </option>
            ))}
          </select>
        </label>
        {youtubeAccounts.length === 0 && (
          <p className="mb-3 text-sm text-warning">
            <Link href="/accounts" className="underline">
              Connect YouTube
            </Link>{" "}
            before scheduling.
          </p>
        )}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <label className="text-sm">
            <span className="text-muted">When</span>
            <input
              type="datetime-local"
              className="mt-1 block w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
              value={scheduledFor}
              onChange={(e) => setScheduledFor(e.target.value)}
            />
          </label>
          <label className="text-sm">
            <span className="text-muted">Title override</span>
            <input
              className="mt-1 block w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Optional"
            />
          </label>
          <Button
            size="sm"
            onClick={() => scheduleMutation.mutate()}
            disabled={
              scheduleMutation.isPending ||
              scheduledFor === "" ||
              activeRenderedId === "" ||
              connectedAccountId === ""
            }
          >
            Schedule
          </Button>
        </div>
        {scheduleMutation.isError && (
          <p className="mt-2 text-sm text-danger">{scheduleMutation.error.message}</p>
        )}
        {scheduleMutation.isSuccess && (
          <p className="mt-2 text-sm text-success">Scheduled successfully.</p>
        )}
      </Card>

      <Card>
        <CardTitle>Upcoming & recent</CardTitle>
        <ul className="mt-3 space-y-2 text-sm">
          {items.length === 0 && (
            <li className="text-muted">No scheduled publishes in this window.</li>
          )}
          {items.map((row) => (
            <li
              key={row.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2"
            >
              <span>
                {new Date(row.scheduledFor).toLocaleString()} · {row.platform} ·{" "}
                {row.status}
                {" — "}
                {row.renderedClip?.clipCandidate?.suggestedTitle ?? "Clip"}
              </span>
              {row.status === "scheduled" && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => cancelMutation.mutate(row.id)}
                >
                  Cancel
                </Button>
              )}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
};
