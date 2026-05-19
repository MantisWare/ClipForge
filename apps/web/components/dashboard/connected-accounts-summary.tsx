"use client";

import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

type AccountRow = {
  id: string;
  platform: string;
  accountName: string;
  status: string;
  publishCapability?: string | null;
};

const PLATFORMS = ["youtube", "tiktok", "instagram"] as const;

type Props = {
  workspaceId: string;
};

export const ConnectedAccountsSummary = ({ workspaceId }: Props) => {
  const { data, isLoading } = useQuery({
    queryKey: ["accounts", workspaceId],
    queryFn: async () => {
      const res = await fetch(`/api/accounts?workspaceId=${workspaceId}`);
      const json = (await res.json()) as { data?: AccountRow[] };
      return json.data ?? [];
    },
  });

  const byPlatform = (platform: string) =>
    data?.find((a) => a.platform === platform);

  return (
    <Card>
      <CardTitle>Connected accounts</CardTitle>
      <CardDescription className="mb-4">
        Publishing destinations for this workspace.
      </CardDescription>
      {isLoading && <p className="text-sm text-muted">Loading…</p>}
      <ul className="space-y-2">
        {PLATFORMS.map((platform) => {
          const account = byPlatform(platform);
          const label =
            account?.status === "connected"
              ? account.accountName
              : "Not connected";
          return (
            <li
              key={platform}
              className="flex items-center justify-between rounded-lg border border-border bg-panel-2 px-3 py-2 text-sm capitalize"
            >
              <span>{platform}</span>
              <span
                className={cn(
                  account?.status === "connected"
                    ? "text-success"
                    : "text-muted",
                )}
              >
                {label}
              </span>
            </li>
          );
        })}
      </ul>
      <Link
        href="/accounts"
        className="mt-4 inline-block text-sm text-accent-cyan hover:underline"
      >
        Manage accounts
      </Link>
    </Card>
  );
};
