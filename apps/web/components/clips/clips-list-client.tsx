"use client";

import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

type RenderedRow = {
  id: string;
  status: string;
  createdAt: string;
  clipCandidate?: {
    suggestedTitle?: string | null;
    overallScore?: number;
  };
};

type Props = {
  workspaceId: string;
};

export const ClipsListClient = ({ workspaceId }: Props) => {
  const { data, isLoading } = useQuery({
    queryKey: ["rendered", workspaceId],
    queryFn: async () => {
      const res = await fetch(`/api/rendered?workspaceId=${workspaceId}`);
      const json = (await res.json()) as { data?: RenderedRow[] };
      return json.data ?? [];
    },
    refetchInterval: (query) => {
      const hasActive = (query.state.data ?? []).some(
        (r) => r.status === "queued" || r.status === "rendering",
      );
      return hasActive ? 3000 : false;
    },
  });

  if (isLoading) {
    return <p className="text-sm text-muted">Loading clips…</p>;
  }

  if ((data?.length ?? 0) === 0) {
    return (
      <p className="text-sm text-muted">
        No rendered clips yet. Approve a candidate on a project and click Render.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {data?.map((row) => (
        <li key={row.id}>
          <Link href={`/clips/${row.id}/preview`}>
            <Card className="hover:border-accent-cyan/40">
              <CardTitle>
                {row.clipCandidate?.suggestedTitle ?? "Rendered clip"}
              </CardTitle>
              <CardDescription>
                {row.status} ·{" "}
                {new Date(row.createdAt).toLocaleDateString()}
                {row.clipCandidate?.overallScore !== undefined &&
                  ` · score ${Math.round(row.clipCandidate.overallScore)}`}
              </CardDescription>
            </Card>
          </Link>
        </li>
      ))}
    </ul>
  );
};
