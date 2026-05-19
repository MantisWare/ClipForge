"use client";

import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";

type AccountRow = {
  id: string;
  platform: string;
  accountName: string;
  status: string;
  publishCapability?: string | null;
};

const PLATFORMS = [
  { id: "youtube", label: "YouTube", capability: "DIRECT_POST_READY" },
  { id: "tiktok", label: "TikTok", capability: "PRIVATE_ONLY" },
  { id: "instagram", label: "Instagram", capability: "REQUIRES_AUDIT" },
] as const;

type Props = {
  workspaceId: string;
};

export const AccountsClient = ({ workspaceId }: Props) => {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["accounts", workspaceId],
    queryFn: async () => {
      const res = await fetch(`/api/accounts?workspaceId=${workspaceId}`);
      const json = (await res.json()) as { data?: AccountRow[] };
      return json.data ?? [];
    },
  });

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {PLATFORMS.map((platform) => {
        const account = data?.find((a) => a.platform === platform.id);
        const connected = account?.status === "connected";

        return (
          <Card key={platform.id}>
            <CardTitle>{platform.label}</CardTitle>
            <CardDescription className="mb-4">
              {platform.id === "youtube"
                ? "Publish Shorts directly"
                : `Export only (${platform.capability})`}
            </CardDescription>
            {isLoading && <p className="text-sm text-muted">Loading…</p>}
            {!isLoading && (
              <p className="mb-3 text-sm">
                {connected
                  ? account?.accountName ?? "Connected"
                  : "Not connected"}
              </p>
            )}
            {platform.id === "youtube" && (
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/api/accounts/connect/youtube?workspaceId=${workspaceId}`}
                  className="inline-flex h-8 items-center justify-center rounded-lg bg-brand-gradient px-3 text-xs font-medium text-white"
                >
                  {connected ? "Reconnect YouTube" : "Connect YouTube"}
                </Link>
                {connected && account?.id !== undefined && (
                  <button
                    type="button"
                    className="inline-flex h-8 items-center justify-center rounded-lg border border-border px-3 text-xs text-muted"
                    onClick={async () => {
                      await fetch(`/api/accounts/${account.id}`, {
                        method: "DELETE",
                      });
                      void queryClient.invalidateQueries({
                        queryKey: ["accounts", workspaceId],
                      });
                    }}
                  >
                    Disconnect
                  </button>
                )}
              </div>
            )}
            {platform.id !== "youtube" && (
              <p className="text-xs text-muted">
                Manual publish via downloaded MP4 from render preview.
              </p>
            )}
          </Card>
        );
      })}
    </div>
  );
};
