"use client";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { OverlayAnalyticsSummary } from "@/components/monetization/overlay-analytics-summary";
import { useEffect, useState } from "react";

type ProductLinkRow = {
  id: string;
  title: string;
  url: string;
  priceLabel: string | null;
  affiliateNetwork: string | null;
  active: boolean;
};

type OverlayTemplateRow = {
  id: string;
  name: string;
  overlayType: string;
};

type OverlaySettings = {
  defaultDisclosureText: string | null;
  requireDisclosureOnExport: boolean;
  urlAllowlist: string[];
  renderWebhookUrl: string | null;
  amazonAssociateTag: string | null;
  amazonMarketplace: string;
  ebayCampaignId: string | null;
  walmartAffiliateId: string | null;
  bestBuyAffiliateId: string | null;
  etsyAwinAffiliateId: string | null;
  affiliateFallbackOrder: string[];
  aiProductDiscoveryEnabled: boolean;
  autoDiscoverOnApprove: boolean;
  requirePaapiForAmazon: boolean;
};

type Props = { workspaceId: string };

export const MonetizationClient = ({ workspaceId }: Props) => {
  const queryClient = useQueryClient();
  const [productTitle, setProductTitle] = useState("");
  const [productUrl, setProductUrl] = useState("");
  const [csv, setCsv] = useState("");
  const [disclosure, setDisclosure] = useState("");
  const [amazonTag, setAmazonTag] = useState("");
  const [amazonMarketplace, setAmazonMarketplace] = useState("www.amazon.com");
  const [ebayCampaignId, setEbayCampaignId] = useState("");
  const [walmartAffiliateId, setWalmartAffiliateId] = useState("");
  const [bestBuyAffiliateId, setBestBuyAffiliateId] = useState("");
  const [etsyAwinAffiliateId, setEtsyAwinAffiliateId] = useState("");
  const [aiDiscoveryEnabled, setAiDiscoveryEnabled] = useState(true);
  const [autoDiscoverOnApprove, setAutoDiscoverOnApprove] = useState(false);
  const [requirePaapiForAmazon, setRequirePaapiForAmazon] = useState(false);
  const [urlAllowlist, setUrlAllowlist] = useState("");
  const [renderWebhookUrl, setRenderWebhookUrl] = useState("");

  const productsQuery = useQuery({
    queryKey: ["product-links", workspaceId],
    queryFn: async () => {
      const res = await fetch(`/api/product-links?workspaceId=${workspaceId}`);
      const json = (await res.json()) as { data?: ProductLinkRow[] };
      return json.data ?? [];
    },
  });

  const templatesQuery = useQuery({
    queryKey: ["overlay-templates", workspaceId],
    queryFn: async () => {
      const res = await fetch(
        `/api/overlay-templates?workspaceId=${workspaceId}`,
      );
      const json = (await res.json()) as { data?: OverlayTemplateRow[] };
      return json.data ?? [];
    },
  });

  const settingsQuery = useQuery({
    queryKey: ["overlay-settings", workspaceId],
    queryFn: async () => {
      const res = await fetch(`/api/workspaces/${workspaceId}/overlay-settings`);
      const json = (await res.json()) as { data?: OverlaySettings };
      return json.data;
    },
  });

  const createProductMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/product-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          title: productTitle,
          url: productUrl,
        }),
      });
      const json = (await res.json()) as { error?: { message: string } };
      if (json.error !== undefined) throw new Error(json.error.message);
    },
    onSuccess: () => {
      setProductTitle("");
      setProductUrl("");
      void queryClient.invalidateQueries({
        queryKey: ["product-links", workspaceId],
      });
    },
  });

  const importCsvMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/product-links/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, csv }),
      });
      const json = (await res.json()) as { error?: { message: string } };
      if (json.error !== undefined) throw new Error(json.error.message);
    },
    onSuccess: () => {
      setCsv("");
      void queryClient.invalidateQueries({
        queryKey: ["product-links", workspaceId],
      });
    },
  });

  const saveSettingsMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/workspaces/${workspaceId}/overlay-settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          defaultDisclosureText: disclosure,
          amazonAssociateTag: amazonTag !== "" ? amazonTag : null,
          amazonMarketplace,
          ebayCampaignId: ebayCampaignId !== "" ? ebayCampaignId : null,
          walmartAffiliateId:
            walmartAffiliateId !== "" ? walmartAffiliateId : null,
          bestBuyAffiliateId:
            bestBuyAffiliateId !== "" ? bestBuyAffiliateId : null,
          etsyAwinAffiliateId:
            etsyAwinAffiliateId !== "" ? etsyAwinAffiliateId : null,
          aiProductDiscoveryEnabled: aiDiscoveryEnabled,
          autoDiscoverOnApprove,
          requirePaapiForAmazon,
          urlAllowlist: urlAllowlist
            .split("\n")
            .map((line) => line.trim())
            .filter((line) => line !== ""),
          renderWebhookUrl:
            renderWebhookUrl !== "" ? renderWebhookUrl : null,
        }),
      });
      const json = (await res.json()) as { error?: { message: string } };
      if (json.error !== undefined) throw new Error(json.error.message);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["overlay-settings", workspaceId],
      });
    },
  });

  const products = productsQuery.data ?? [];
  const templates = templatesQuery.data ?? [];

  useEffect(() => {
    if (settingsQuery.data === undefined) {
      return;
    }
    if (
      settingsQuery.data.defaultDisclosureText !== null &&
      settingsQuery.data.defaultDisclosureText !== ""
    ) {
      setDisclosure(settingsQuery.data.defaultDisclosureText);
    }
    setAmazonTag(settingsQuery.data.amazonAssociateTag ?? "");
    setAmazonMarketplace(
      settingsQuery.data.amazonMarketplace ?? "www.amazon.com",
    );
    setEbayCampaignId(settingsQuery.data.ebayCampaignId ?? "");
    setWalmartAffiliateId(settingsQuery.data.walmartAffiliateId ?? "");
    setBestBuyAffiliateId(settingsQuery.data.bestBuyAffiliateId ?? "");
    setEtsyAwinAffiliateId(settingsQuery.data.etsyAwinAffiliateId ?? "");
    setAiDiscoveryEnabled(settingsQuery.data.aiProductDiscoveryEnabled ?? true);
    setAutoDiscoverOnApprove(settingsQuery.data.autoDiscoverOnApprove ?? false);
    setRequirePaapiForAmazon(settingsQuery.data.requirePaapiForAmazon ?? false);
    setUrlAllowlist((settingsQuery.data.urlAllowlist ?? []).join("\n"));
    setRenderWebhookUrl(settingsQuery.data.renderWebhookUrl ?? "");
  }, [settingsQuery.data]);

  return (
    <div className="space-y-6">
      <OverlayAnalyticsSummary workspaceId={workspaceId} />
      <Card>
        <CardTitle>Affiliate networks</CardTitle>
        <CardDescription className="mb-4">
          AI picks one product per clip. Networks are tried in order (Amazon →
          eBay → Walmart → Best Buy → Etsy) until a link is created. Configure
          any combination — at least one is required.
        </CardDescription>
        <div className="mb-4 grid gap-4 sm:grid-cols-2">
          <label className="block text-xs text-muted">
            Amazon Associates tag
            <input
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              value={amazonTag}
              onChange={(e) => setAmazonTag(e.target.value)}
              placeholder="yoursite-20"
            />
          </label>
          <label className="block text-xs text-muted">
            Amazon marketplace
            <input
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              value={amazonMarketplace}
              onChange={(e) => setAmazonMarketplace(e.target.value)}
              placeholder="www.amazon.com"
            />
          </label>
          <label className="block text-xs text-muted">
            eBay Partner campaign ID
            <input
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              value={ebayCampaignId}
              onChange={(e) => setEbayCampaignId(e.target.value)}
              placeholder="5338782847"
            />
          </label>
          <label className="block text-xs text-muted">
            Walmart affiliate ID (Impact)
            <input
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              value={walmartAffiliateId}
              onChange={(e) => setWalmartAffiliateId(e.target.value)}
              placeholder="Impact publisher id"
            />
          </label>
          <label className="block text-xs text-muted">
            Best Buy affiliate ID (Impact)
            <input
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              value={bestBuyAffiliateId}
              onChange={(e) => setBestBuyAffiliateId(e.target.value)}
              placeholder="Impact publisher id"
            />
          </label>
          <label className="block text-xs text-muted">
            Etsy Awin affiliate ID
            <input
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              value={etsyAwinAffiliateId}
              onChange={(e) => setEtsyAwinAffiliateId(e.target.value)}
              placeholder="Awin publisher id"
            />
          </label>
        </div>
        <label className="mb-2 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={aiDiscoveryEnabled}
            onChange={(e) => setAiDiscoveryEnabled(e.target.checked)}
          />
          Enable AI affiliate product discovery
        </label>
        <label className="mb-2 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={autoDiscoverOnApprove}
            onChange={(e) => setAutoDiscoverOnApprove(e.target.checked)}
          />
          Auto-discover product when a clip is approved
        </label>
        <label className="mb-2 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={requirePaapiForAmazon}
            onChange={(e) => setRequirePaapiForAmazon(e.target.checked)}
          />
          Require Amazon PA-API match before using Amazon (else try next network)
        </label>
        <p className="mt-2 text-xs text-muted">
          Server: set OPENAI_API_KEY, optional OPENAI_BASE_URL, AMAZON_PAAPI_*,
          EBAY_CLIENT_ID / EBAY_CLIENT_SECRET for richer matches.
        </p>
      </Card>
      <Card>
        <CardTitle>Advanced</CardTitle>
        <CardDescription className="mb-4">
          URL allowlist (one domain per line, empty = allow all HTTPS) and optional
          webhook when monetized render completes.
        </CardDescription>
        <label className="mb-3 block text-xs text-muted">
          URL allowlist
          <textarea
            className="mt-1 min-h-[60px] w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-xs"
            value={urlAllowlist}
            onChange={(e) => setUrlAllowlist(e.target.value)}
            placeholder="amazon.com&#10;ebay.com"
          />
        </label>
        <label className="mb-3 block text-xs text-muted">
          Render complete webhook URL
          <input
            className="mt-1 w-full max-w-lg rounded-lg border border-border bg-background px-3 py-2 text-sm"
            value={renderWebhookUrl}
            onChange={(e) => setRenderWebhookUrl(e.target.value)}
            placeholder="https://example.com/hooks/render"
          />
        </label>
      </Card>
      <Card>
        <CardTitle>Disclosure defaults</CardTitle>
        <CardDescription className="mb-4">
          Shown on affiliate and sponsored overlays before export.
        </CardDescription>
        <textarea
          className="mb-3 min-h-[80px] w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          value={disclosure}
          onChange={(e) => setDisclosure(e.target.value)}
          placeholder="Links may earn a commission. #ad"
        />
        <Button
          size="sm"
          onClick={() => saveSettingsMutation.mutate()}
          disabled={saveSettingsMutation.isPending}
        >
          Save settings
        </Button>
      </Card>

      <Card>
        <CardTitle>Product links</CardTitle>
        <CardDescription className="mb-4">
          Catalog for product pins and affiliate CTAs.
        </CardDescription>
        <div className="mb-4 flex flex-wrap gap-2">
          <input
            className="h-9 rounded-lg border border-border bg-background px-3 text-sm"
            placeholder="Product title"
            value={productTitle}
            onChange={(e) => setProductTitle(e.target.value)}
          />
          <input
            className="h-9 min-w-[240px] flex-1 rounded-lg border border-border bg-background px-3 text-sm"
            placeholder="https://..."
            value={productUrl}
            onChange={(e) => setProductUrl(e.target.value)}
          />
          <Button
            size="sm"
            onClick={() => createProductMutation.mutate()}
            disabled={
              createProductMutation.isPending ||
              productTitle === "" ||
              productUrl === ""
            }
          >
            Add product
          </Button>
        </div>
        <ul className="space-y-2 text-sm">
          {products.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
            >
              <span>
                {p.title}
                {p.priceLabel !== null ? ` · ${p.priceLabel}` : ""}
              </span>
              <span className="truncate text-xs text-muted">{p.url}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <CardTitle>Import CSV</CardTitle>
        <CardDescription className="mb-4">
          Columns: title, url, priceLabel, affiliateNetwork
        </CardDescription>
        <textarea
          className="mb-3 min-h-[100px] w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-xs"
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
          placeholder="Wireless Mic,https://example.com,$99,amazon"
        />
        <Button
          size="sm"
          variant="secondary"
          onClick={() => importCsvMutation.mutate()}
          disabled={importCsvMutation.isPending || csv === ""}
        >
          Import products
        </Button>
      </Card>

      <Card>
        <CardTitle>Overlay templates</CardTitle>
        <CardDescription>
          {templates.length} preset{templates.length === 1 ? "" : "s"} in
          workspace library.
        </CardDescription>
        <ul className="mt-3 space-y-1 text-sm text-muted">
          {templates.map((t) => (
            <li key={t.id}>
              {t.name}{" "}
              <span className="text-xs">({t.overlayType.replace(/_/g, " ")})</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
};
