# Phase 11 — Multi-network affiliate resolver

Extends [Phase 10](phase-10-ai-amazon-affiliate.md) with **eBay**, **Walmart**, **Best Buy**, and **Etsy**, plus a single-link fallback chain.

## Fallback order

Default chain (category-adjusted):

| Category | Order |
|----------|--------|
| **general** | Amazon → eBay → Walmart → Best Buy → Etsy |
| **tech** | Amazon → Best Buy → Walmart → eBay → Etsy |
| **lifestyle** | Amazon → Etsy → eBay → Walmart → Best Buy |

Only **configured** networks are attempted. The first successful resolver wins — **one `ProductLink` + one draft overlay** per discovery job.

## Workspace settings

| Field | Network |
|-------|---------|
| `amazonAssociateTag` | Amazon |
| `ebayCampaignId` | eBay Partner Network |
| `walmartAffiliateId` | Walmart via Impact |
| `bestBuyAffiliateId` | Best Buy via Impact |
| `etsyAwinAffiliateId` | Etsy via Awin |
| `requirePaapiForAmazon` | Skip Amazon unless PA-API returns a product |
| `autoDiscoverOnApprove` | Queue discovery on clip approve |

## Server environment

| Variable | Purpose |
|----------|---------|
| `EBAY_CLIENT_ID` / `EBAY_CLIENT_SECRET` | Optional Browse API for item-level eBay URLs |
| `AMAZON_PAAPI_*` | Optional Amazon ASIN resolution |
| `OPENAI_API_KEY` / `OPENAI_BASE_URL` | LLM + `productCategory` |

## Phase 10 deferred items (completed)

- **Auto-discover on approve** — `autoDiscoverOnApprove` + `maybeEnqueueAffiliateDiscovery` on approve API
- **Product image → S3** — `uploadProductImageFromUrl` after PA-API / eBay image URL
- **Catalog dedup** — reuse `ProductLink` by `(workspaceId, affiliateNetwork, externalProductId)`
- **Non-Amazon networks** — this phase

## Job

Same BullMQ type: `ai.discover_amazon_product` (handler runs unified `runDiscoverAffiliateProduct`).

## UI

- **Monetization** — all five network credential fields + toggles
- **Clip overlays** — **Find affiliate product** (not Amazon-only)

> **Auto-updated by Cursor:** Phase 11 implemented 2026-05-19.
