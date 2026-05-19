"use client";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RIGHTS_WARNING } from "@clipforge/shared";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";

type DiscoverItem = {
  id: string;
  title: string;
  channel: string;
  thumbnailUrl: string | null;
  duration: string;
  viewCount?: number;
  sourceUrl: string;
  rightsStatus?: string;
};

const rightsBadge = (status?: string) => {
  if (status === "permission_required") {
    return (
      <span className="rounded-full bg-warning/20 px-2 py-0.5 text-xs text-warning">
        Rights required
      </span>
    );
  }
  if (status === "owned") {
    return (
      <span className="rounded-full bg-success/20 px-2 py-0.5 text-xs text-success">
        Own content
      </span>
    );
  }
  return (
    <span className="rounded-full bg-panel-2 px-2 py-0.5 text-xs text-muted">
      Unknown rights
    </span>
  );
};

type Props = {
  workspaceId: string;
};

export const DiscoverClient = ({ workspaceId }: Props) => {
  const [keyword, setKeyword] = useState("");
  const [region, setRegion] = useState("US");
  const [searchKeyword, setSearchKeyword] = useState<string | null>(null);
  const router = useRouter();

  const popularQuery = useQuery({
    queryKey: ["discover", "popular", region],
    queryFn: async () => {
      const res = await fetch(
        `/api/discover/youtube/most-popular?region=${region}&maxResults=12`,
      );
      const json = (await res.json()) as {
        data?: { items?: DiscoverItem[]; rightsWarning?: string };
        error?: { message: string };
      };
      if (json.error !== undefined) {
        throw new Error(json.error.message);
      }
      return json.data;
    },
  });

  const searchQuery = useQuery({
    queryKey: ["discover", "search", searchKeyword, region],
    queryFn: async () => {
      const res = await fetch(
        `/api/discover/youtube/search?keyword=${encodeURIComponent(searchKeyword ?? "")}&region=${region}&maxResults=12`,
      );
      const json = (await res.json()) as {
        data?: { items?: DiscoverItem[] };
        error?: { message: string };
      };
      if (json.error !== undefined) {
        throw new Error(json.error.message);
      }
      return json.data;
    },
    enabled: searchKeyword !== null && searchKeyword !== "",
  });

  const importMutation = useMutation({
    mutationFn: async (sourceUrl: string) => {
      const validateRes = await fetch("/api/sources/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceUrl, workspaceId }),
      });
      const validateJson = (await validateRes.json()) as {
        data?: { sourceType: string; title?: string };
        error?: { message: string };
      };
      if (validateJson.error !== undefined) {
        throw new Error(validateJson.error.message);
      }

      const importRes = await fetch("/api/sources/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceUrl,
          workspaceId,
          sourceType: validateJson.data?.sourceType,
          title: validateJson.data?.title,
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
      if (sourceId !== undefined) {
        router.push(`/projects/${sourceId}`);
      }
    },
  });

  const items =
    searchKeyword !== null && searchKeyword !== ""
      ? (searchQuery.data?.items ?? [])
      : (popularQuery.data?.items ?? []);

  const isLoading =
    searchKeyword !== null && searchKeyword !== ""
      ? searchQuery.isLoading
      : popularQuery.isLoading;

  return (
    <div className="space-y-6">
      <Card className="border-warning/30">
        <CardTitle className="text-warning">Rights notice</CardTitle>
        <CardDescription>{RIGHTS_WARNING}</CardDescription>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Search YouTube…"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="max-w-md"
          aria-label="Search keyword"
        />
        <Input
          placeholder="Region (e.g. US)"
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          className="w-24"
          aria-label="Region code"
        />
        <Button
          onClick={() => setSearchKeyword(keyword)}
          disabled={keyword === ""}
        >
          Search
        </Button>
        <Button variant="secondary" onClick={() => setSearchKeyword(null)}>
          Show popular
        </Button>
      </div>

      {isLoading && <p className="text-sm text-muted">Loading videos…</p>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <Card key={item.id}>
            {item.thumbnailUrl !== null && (
              <img
                src={item.thumbnailUrl}
                alt=""
                className="mb-3 aspect-video w-full rounded-lg object-cover"
              />
            )}
            <div className="mb-2 flex flex-wrap items-center gap-2">
              {rightsBadge(item.rightsStatus)}
            </div>
            <CardTitle className="line-clamp-2 text-base">{item.title}</CardTitle>
            <CardDescription className="mb-3">
              {item.channel} · {item.duration}
              {item.viewCount !== undefined
                ? ` · ${item.viewCount.toLocaleString()} views`
                : ""}
            </CardDescription>
            <Button
              size="sm"
              onClick={() => importMutation.mutate(item.sourceUrl)}
              disabled={importMutation.isPending}
            >
              Analyze
            </Button>
          </Card>
        ))}
      </div>

      {importMutation.isError && (
        <p className="text-sm text-danger">{importMutation.error.message}</p>
      )}
    </div>
  );
};
