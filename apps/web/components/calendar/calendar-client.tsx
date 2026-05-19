"use client";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

type ScheduledRow = {
  id: string;
  platform: string;
  scheduledFor: string;
  status: string;
  renderedClip?: { clipCandidate?: { suggestedTitle?: string | null } };
};

type Props = { workspaceId: string; renderedClipId?: string };

export const CalendarClient = ({ workspaceId, renderedClipId }: Props) => {
  const queryClient = useQueryClient();
  const [scheduledFor, setScheduledFor] = useState("");
  const [title, setTitle] = useState("");

  const calendarQuery = useQuery({
    queryKey: ["calendar", workspaceId],
    queryFn: async () => {
      const res = await fetch(`/api/calendar?workspaceId=${workspaceId}`);
      const json = (await res.json()) as { data?: { scheduled?: ScheduledRow[] } };
      return json.data?.scheduled ?? [];
    },
  });

  const scheduleMutation = useMutation({
    mutationFn: async () => {
      if (renderedClipId === undefined || renderedClipId === "") {
        throw new Error("Select a rendered clip from preview to schedule");
      }
      const res = await fetch("/api/scheduled-publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          renderedClipId,
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
      {renderedClipId !== undefined && renderedClipId !== "" && (
        <Card>
          <CardTitle>Schedule YouTube publish</CardTitle>
          <CardDescription className="mb-3">
            Requires a connected YouTube account.
          </CardDescription>
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
              <span className="text-muted">Title</span>
              <input
                className="mt-1 block w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </label>
            <Button
              size="sm"
              onClick={() => scheduleMutation.mutate()}
              disabled={scheduleMutation.isPending || scheduledFor === ""}
            >
              Schedule
            </Button>
          </div>
          {scheduleMutation.isError && (
            <p className="mt-2 text-sm text-danger">{scheduleMutation.error.message}</p>
          )}
        </Card>
      )}

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
