"use client";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import {
  anchorToRect,
  detectCaptionOverlap,
  getOverlaySafeAreas,
  scoreOverlayDensity,
  type ClipOverlayItem,
} from "@clipforge/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { OverlayPreviewCanvas } from "./overlay-preview-canvas";

type OverlayRow = ClipOverlayItem & {
  id: string;
  productLink?: { id: string; title: string; url: string } | null;
};

type Props = {
  clipId: string;
  sourceId: string;
  workspaceId: string;
  clipDurationMs: number;
  suggestedHook?: string | null;
};

const styleString = (style: Record<string, unknown> | undefined, key: string) => {
  const val = style?.[key];
  return typeof val === "string" ? val : "";
};

export const ClipOverlayEditor = ({
  clipId,
  sourceId,
  workspaceId,
  clipDurationMs,
  suggestedHook,
}: Props) => {
  const queryClient = useQueryClient();
  const [localOverlays, setLocalOverlays] = useState<OverlayRow[] | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [ctaVariants, setCtaVariants] = useState<string[]>([]);

  const overlaysQuery = useQuery({
    queryKey: ["clip-overlays", clipId],
    queryFn: async () => {
      const res = await fetch(
        `/api/clips/${clipId}/overlays?workspaceId=${workspaceId}`,
      );
      const json = (await res.json()) as { data?: OverlayRow[] };
      return json.data ?? [];
    },
  });

  const overlays = localOverlays ?? overlaysQuery.data ?? [];
  const selected = overlays[selectedIndex];

  const density = useMemo(() => scoreOverlayDensity(overlays), [overlays]);

  const updateOverlayAt = useCallback(
    (index: number, patch: Partial<OverlayRow>) => {
      setLocalOverlays(
        overlays.map((item, i) => (i === index ? { ...item, ...patch } : item)),
      );
    },
    [overlays],
  );

  const updateStyleField = (index: number, key: string, value: string) => {
    const row = overlays[index];
    if (row === undefined) return;
    const style =
      typeof row.style === "object" && row.style !== null
        ? (row.style as Record<string, unknown>)
        : {};
    updateOverlayAt(index, { style: { ...style, [key]: value } });
  };

  const nudgePosition = (index: number, dx: number, dy: number) => {
    const row = overlays[index];
    if (row === undefined) return;
    const margin = row.position?.marginPx ?? 80;
    const anchors = [
      "top_left",
      "top_right",
      "bottom_left",
      "bottom_right",
      "center",
      "bottom_center",
    ] as const;
    const current = row.position?.anchor ?? "bottom_right";
    const idx = anchors.indexOf(current as (typeof anchors)[number]);
    const nextIndex =
      dx !== 0 && idx >= 0
        ? Math.min(anchors.length - 1, Math.max(0, idx + dx))
        : idx >= 0
          ? idx
          : 0;
    const nextAnchor = anchors[nextIndex] ?? "bottom_right";

    updateOverlayAt(index, {
      position: {
        anchor: nextAnchor,
        marginPx: Math.max(0, margin + dy * 8),
      },
    });
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      if (overlays.length === 0) return;
      if (e.key === "ArrowUp") {
        e.preventDefault();
        nudgePosition(selectedIndex, 0, -1);
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        nudgePosition(selectedIndex, 0, 1);
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        nudgePosition(selectedIndex, -1, 0);
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        nudgePosition(selectedIndex, 1, 0);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [overlays.length, selectedIndex]);

  const saveMutation = useMutation({
    mutationFn: async (items: OverlayRow[]) => {
      const res = await fetch(`/api/clips/${clipId}/overlays`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          overlays: items.map(({ id: _id, productLink: _p, ...rest }) => rest),
        }),
      });
      const json = (await res.json()) as { error?: { message: string } };
      if (json.error !== undefined) throw new Error(json.error.message);
    },
    onSuccess: () => {
      setLocalOverlays(null);
      void queryClient.invalidateQueries({ queryKey: ["clip-overlays", clipId] });
    },
  });

  const suggestMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/clips/${clipId}/overlays/suggest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId }),
      });
      const json = (await res.json()) as { error?: { message: string } };
      if (json.error !== undefined) throw new Error(json.error.message);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["clip-overlays", clipId] });
    },
  });

  const confirmDraftsMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/clips/${clipId}/overlays/confirm-drafts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId }),
      });
      const json = (await res.json()) as { error?: { message: string } };
      if (json.error !== undefined) throw new Error(json.error.message);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["clip-overlays", clipId] });
    },
  });

  const brandKitMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(
        `/api/clips/${clipId}/overlays/apply-brand-kit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ workspaceId }),
        },
      );
      const json = (await res.json()) as { error?: { message: string } };
      if (json.error !== undefined) throw new Error(json.error.message);
    },
    onSuccess: () => {
      setLocalOverlays(null);
      void queryClient.invalidateQueries({ queryKey: ["clip-overlays", clipId] });
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(
        `/api/clips/${clipId}/overlays/duplicate-siblings`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ workspaceId }),
        },
      );
      const json = (await res.json()) as {
        data?: { duplicatedCount: number };
        error?: { message: string };
      };
      if (json.error !== undefined) throw new Error(json.error.message);
      return json.data;
    },
  });

  const loadCtaVariants = async () => {
    const productTitle = selected?.productLink?.title;
    const params = new URLSearchParams({ workspaceId });
    if (productTitle !== undefined && productTitle !== "") {
      params.set("productTitle", productTitle);
    }
    const res = await fetch(
      `/api/clips/${clipId}/overlays/cta-variants?${params.toString()}`,
    );
    const json = (await res.json()) as { data?: { variants: string[] } };
    setCtaVariants(json.data?.variants ?? []);
  };

  const addEndSlate = () => {
    const durationMs = 3000;
    const next: OverlayRow = {
      id: `local-${Date.now()}`,
      overlayType: "end_slate",
      startMs: Math.max(0, clipDurationMs - durationMs),
      endMs: clipDurationMs,
      position: { anchor: "center", marginPx: 80 },
      style: { headline: "Follow for more", cta: "Link in bio" },
      compliance: "none",
      sortOrder: overlays.length,
      isDraft: false,
    };
    setLocalOverlays([...overlays, next]);
    setSelectedIndex(overlays.length);
  };

  const areas = getOverlaySafeAreas();
  const selectedStyle =
    typeof selected?.style === "object" && selected.style !== null
      ? (selected.style as Record<string, unknown>)
      : {};

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" onClick={addEndSlate}>
          Add end slate
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => brandKitMutation.mutate()}
          disabled={brandKitMutation.isPending}
        >
          Apply brand kit
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => suggestMutation.mutate()}
          disabled={suggestMutation.isPending}
        >
          AI suggest
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => confirmDraftsMutation.mutate()}
          disabled={confirmDraftsMutation.isPending}
        >
          Confirm drafts
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => duplicateMutation.mutate()}
          disabled={duplicateMutation.isPending}
        >
          Duplicate to siblings
        </Button>
        <Button
          size="sm"
          onClick={() => saveMutation.mutate(overlays)}
          disabled={saveMutation.isPending}
        >
          Save overlays
        </Button>
      </div>

      <p className="text-xs text-muted">
        Arrow keys nudge position on the selected overlay. Hook:{" "}
        {suggestedHook ?? "—"}
      </p>

      {duplicateMutation.isSuccess && (
        <p className="text-sm text-success">
          Copied to {duplicateMutation.data?.duplicatedCount ?? 0} sibling clip(s).
        </p>
      )}

      {density.warnings.length > 0 && (
        <div className="rounded-lg border border-warning/50 bg-warning/10 px-3 py-2 text-sm text-warning">
          {density.warnings.map((w) => (
            <p key={w}>{w}</p>
          ))}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <OverlayPreviewCanvas overlays={overlays} />
        <div className="space-y-4">
          {selected !== undefined && (
            <Card>
              <CardTitle className="text-base">Style inspector</CardTitle>
              <CardDescription className="mb-3">
                {selected.overlayType.replace(/_/g, " ")}
              </CardDescription>
              <div className="space-y-2 text-sm">
                <label className="block text-xs text-muted">
                  Headline
                  <input
                    className="mt-1 w-full rounded border border-border bg-background px-2 py-1"
                    value={styleString(selectedStyle, "headline")}
                    onChange={(e) =>
                      updateStyleField(selectedIndex, "headline", e.target.value)
                    }
                  />
                </label>
                <label className="block text-xs text-muted">
                  CTA
                  <input
                    className="mt-1 w-full rounded border border-border bg-background px-2 py-1"
                    value={styleString(selectedStyle, "cta")}
                    onChange={(e) =>
                      updateStyleField(selectedIndex, "cta", e.target.value)
                    }
                  />
                </label>
                <label className="block text-xs text-muted">
                  Promo code
                  <input
                    className="mt-1 w-full rounded border border-border bg-background px-2 py-1"
                    value={styleString(selectedStyle, "promoCode")}
                    onChange={(e) =>
                      updateStyleField(
                        selectedIndex,
                        "promoCode",
                        e.target.value,
                      )
                    }
                  />
                </label>
                <label className="block text-xs text-muted">
                  Disclosure
                  <input
                    className="mt-1 w-full rounded border border-border bg-background px-2 py-1"
                    value={styleString(selectedStyle, "disclosure")}
                    onChange={(e) =>
                      updateStyleField(
                        selectedIndex,
                        "disclosure",
                        e.target.value,
                      )
                    }
                  />
                </label>
                <Button
                  size="sm"
                  variant="secondary"
                  type="button"
                  onClick={() => void loadCtaVariants()}
                >
                  CTA variants
                </Button>
                {ctaVariants.length > 0 && (
                  <ul className="space-y-1">
                    {ctaVariants.map((variant) => (
                      <li key={variant}>
                        <button
                          type="button"
                          className="text-left text-accent-cyan hover:underline"
                          onClick={() =>
                            updateStyleField(selectedIndex, "cta", variant)
                          }
                        >
                          {variant}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Card>
          )}

          <Card>
            <CardTitle className="text-base">Overlay timeline</CardTitle>
            <CardDescription className="mb-3">
              Relative to clip (0–{Math.round(clipDurationMs)} ms). Project:{" "}
              <a
                href={`/projects/${sourceId}`}
                className="text-accent-cyan hover:underline"
              >
                {sourceId.slice(0, 8)}…
              </a>
            </CardDescription>
            <ul className="max-h-[400px] space-y-3 overflow-y-auto text-sm">
              {overlays.map((o, index) => {
                const rect = anchorToRect(
                  o.position?.anchor ?? "bottom_right",
                  o.position?.marginPx ?? 80,
                  320,
                  120,
                  areas.frameWidth,
                  areas.frameHeight,
                );
                const overlapsCaption = detectCaptionOverlap(rect);
                return (
                  <li
                    key={o.id}
                    className={`cursor-pointer rounded-lg border p-3 ${
                      index === selectedIndex
                        ? "border-accent-cyan bg-panel-2"
                        : "border-border"
                    }`}
                    onClick={() => setSelectedIndex(index)}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-medium">
                        {o.overlayType.replace(/_/g, " ")}
                        {o.isDraft === true ? " (draft)" : ""}
                      </span>
                      {overlapsCaption && (
                        <span className="text-xs text-warning">
                          Caption overlap
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="text-xs text-muted">
                        Start ms
                        <input
                          type="number"
                          className="mt-1 w-full rounded border border-border bg-background px-2 py-1"
                          value={o.startMs}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            updateOverlayAt(index, { startMs: val });
                          }}
                        />
                      </label>
                      <label className="text-xs text-muted">
                        End ms
                        <input
                          type="number"
                          className="mt-1 w-full rounded border border-border bg-background px-2 py-1"
                          value={o.endMs}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            updateOverlayAt(index, { endMs: val });
                          }}
                        />
                      </label>
                    </div>
                    {o.productLink !== undefined && o.productLink !== null && (
                      <p className="mt-1 text-xs text-muted">
                        {o.productLink.title}
                      </p>
                    )}
                  </li>
                );
              })}
              {overlays.length === 0 && (
                <li className="text-muted">No overlays yet.</li>
              )}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
};
