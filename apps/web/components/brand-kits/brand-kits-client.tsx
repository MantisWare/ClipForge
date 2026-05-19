"use client";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

type BrandKitRow = {
  id: string;
  name: string;
  isDefault: boolean;
  primaryColor: string;
  fontFamily: string;
  hookFontSize: number;
};

type Props = { workspaceId: string };

export const BrandKitsClient = ({ workspaceId }: Props) => {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#FFFFFF");

  const kitsQuery = useQuery({
    queryKey: ["brand-kits", workspaceId],
    queryFn: async () => {
      const res = await fetch(`/api/brand-kits?workspaceId=${workspaceId}`);
      const json = (await res.json()) as { data?: BrandKitRow[] };
      return json.data ?? [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/brand-kits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          name: name.trim() !== "" ? name : "New kit",
          primaryColor,
        }),
      });
      const json = (await res.json()) as { error?: { message: string } };
      if (json.error !== undefined) throw new Error(json.error.message);
    },
    onSuccess: () => {
      setName("");
      void queryClient.invalidateQueries({ queryKey: ["brand-kits", workspaceId] });
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: async (kitId: string) => {
      const res = await fetch(`/api/brand-kits/${kitId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, isDefault: true }),
      });
      const json = (await res.json()) as { error?: { message: string } };
      if (json.error !== undefined) throw new Error(json.error.message);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["brand-kits", workspaceId] });
    },
  });

  const kits = kitsQuery.data ?? [];

  return (
    <div className="space-y-6">
      <Card>
        <CardTitle>Create brand kit</CardTitle>
        <CardDescription className="mb-4">
          Colors and hook styling for rendered clips.
        </CardDescription>
        <div className="flex flex-wrap gap-3">
          <input
            className="h-9 rounded-lg border border-border bg-background px-3 text-sm"
            placeholder="Kit name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            type="color"
            className="h-9 w-14 cursor-pointer rounded border border-border"
            value={primaryColor}
            onChange={(e) => setPrimaryColor(e.target.value)}
            aria-label="Primary color"
          />
          <Button
            size="sm"
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending}
          >
            Add kit
          </Button>
        </div>
      </Card>
      <div className="grid gap-4 md:grid-cols-2">
        {kits.map((kit) => (
          <Card key={kit.id}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <CardTitle className="text-base">{kit.name}</CardTitle>
                <CardDescription>
                  {kit.fontFamily} · hook {kit.hookFontSize}px
                </CardDescription>
              </div>
              <span
                className="h-8 w-8 shrink-0 rounded-full border border-border"
                style={{ backgroundColor: kit.primaryColor }}
                title={kit.primaryColor}
              />
            </div>
            {kit.isDefault ? (
              <p className="mt-2 text-xs text-success">Default kit</p>
            ) : (
              <Button
                size="sm"
                variant="secondary"
                className="mt-3"
                onClick={() => setDefaultMutation.mutate(kit.id)}
                disabled={setDefaultMutation.isPending}
              >
                Set as default
              </Button>
            )}
          </Card>
        ))}
      </div>
      {kitsQuery.isLoading && (
        <p className="text-sm text-muted">Loading brand kits…</p>
      )}
    </div>
  );
};
