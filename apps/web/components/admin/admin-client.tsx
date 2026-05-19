"use client";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

type UsageStats = {
  jobs: { queued: number; running: number; failed: number };
  workspaces: number;
};

type WorkspaceRow = {
  id: string;
  name: string;
  plan: string;
  createdAt: string;
  owner: { email: string | null; name: string | null };
  _count: { sourceVideos: number; members: number };
};

export const AdminClient = () => {
  const queryClient = useQueryClient();

  const usageQuery = useQuery({
    queryKey: ["admin-usage"],
    queryFn: async () => {
      const res = await fetch("/api/admin/usage");
      const json = (await res.json()) as {
        data?: UsageStats;
        error?: { message: string };
      };
      if (json.error !== undefined) throw new Error(json.error.message);
      return json.data as UsageStats;
    },
  });

  const workspacesQuery = useQuery({
    queryKey: ["admin-workspaces"],
    queryFn: async () => {
      const res = await fetch("/api/admin/workspaces");
      const json = (await res.json()) as {
        data?: WorkspaceRow[];
        error?: { message: string };
      };
      if (json.error !== undefined) throw new Error(json.error.message);
      return json.data ?? [];
    },
  });

  const planMutation = useMutation({
    mutationFn: async (input: { workspaceId: string; plan: string }) => {
      const res = await fetch(
        `/api/admin/workspaces/${input.workspaceId}/plan`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan: input.plan }),
        },
      );
      const json = (await res.json()) as { error?: { message: string } };
      if (json.error !== undefined) throw new Error(json.error.message);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-workspaces"] });
    },
  });

  const usage = usageQuery.data;

  return (
    <div className="space-y-6">
      <Card>
        <CardTitle>Platform usage</CardTitle>
        <CardDescription className="mb-4">
          Queue health and workspace totals (admin only).
        </CardDescription>
        {usageQuery.isLoading && (
          <p className="text-sm text-muted">Loading…</p>
        )}
        {usage !== undefined && (
          <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
            <div>
              <dt className="text-muted">Queued jobs</dt>
              <dd className="text-lg font-semibold">{usage.jobs.queued}</dd>
            </div>
            <div>
              <dt className="text-muted">Running jobs</dt>
              <dd className="text-lg font-semibold">{usage.jobs.running}</dd>
            </div>
            <div>
              <dt className="text-muted">Failed jobs</dt>
              <dd className="text-lg font-semibold">{usage.jobs.failed}</dd>
            </div>
            <div>
              <dt className="text-muted">Workspaces</dt>
              <dd className="text-lg font-semibold">{usage.workspaces}</dd>
            </div>
          </dl>
        )}
      </Card>

      <Card>
        <CardTitle>Workspaces</CardTitle>
        <CardDescription className="mb-4">
          Recent workspaces — adjust plan for quota testing.
        </CardDescription>
        {workspacesQuery.isLoading && (
          <p className="text-sm text-muted">Loading workspaces…</p>
        )}
        <ul className="max-h-[480px] space-y-2 overflow-y-auto text-sm">
          {(workspacesQuery.data ?? []).map((ws) => (
            <li
              key={ws.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2"
            >
              <div>
                <p className="font-medium">{ws.name}</p>
                <p className="text-xs text-muted">
                  {ws.owner.email ?? ws.owner.name ?? "—"} ·{" "}
                  {ws._count.sourceVideos} sources · {ws._count.members} members
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded bg-panel-2 px-2 py-0.5 text-xs">
                  {ws.plan}
                </span>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={planMutation.isPending}
                  onClick={() =>
                    planMutation.mutate({
                      workspaceId: ws.id,
                      plan: ws.plan === "free" ? "creator" : "free",
                    })
                  }
                >
                  Toggle plan
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
};
