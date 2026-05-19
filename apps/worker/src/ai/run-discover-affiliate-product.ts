import {
  aiProductDiscoveryResultSchema,
  mapWorkspaceAffiliateSettings,
  productCategorySchema,
  resolveAffiliateProductChain,
  uploadProductImageFromUrl,
} from "@clipforge/shared";
import { prisma, type Prisma } from "@clipforge/database";
import { discoverAmazonProductWithAi } from "../lib/worker-ai-client.js";
import type { JobPayload } from "../handlers/types.js";

const findOverlayWindow = (
  clipStartMs: number,
  clipEndMs: number,
  segments: Array<{ startMs: number; endMs: number; text: string }>,
  placementHint: string | undefined,
): { startMs: number; endMs: number } => {
  const clipDurationMs = clipEndMs - clipStartMs;
  const hint = placementHint?.trim().toLowerCase() ?? "";

  if (hint !== "") {
    const match = segments.find((seg) =>
      seg.text.toLowerCase().includes(hint),
    );
    if (match !== undefined) {
      const startMs = Math.max(0, match.startMs - clipStartMs);
      const endMs = Math.min(clipDurationMs, match.endMs - clipStartMs + 400);
      return {
        startMs,
        endMs: Math.max(startMs + 1500, endMs),
      };
    }
  }

  const mid = Math.max(0, Math.floor(clipDurationMs / 2) - 3000);
  return {
    startMs: mid,
    endMs: Math.min(clipDurationMs, mid + 6000),
  };
};

const inferCategory = (
  parsed: ReturnType<typeof aiProductDiscoveryResultSchema.parse>,
): "tech" | "lifestyle" | "general" => {
  if (parsed.productCategory !== undefined) {
    const cat = productCategorySchema.safeParse(parsed.productCategory);
    if (cat.success) {
      return cat.data;
    }
  }
  const label = `${parsed.suggestedCategory ?? ""} ${parsed.searchQuery} ${parsed.productTitle}`.toLowerCase();
  if (
    /tech|gadget|phone|laptop|camera|mic|gaming|console|usb|hdmi|monitor/.test(
      label,
    )
  ) {
    return "tech";
  }
  if (
    /craft|gift|handmade|decor|wedding|art|jewelry|vintage|home decor|etsy/.test(
      label,
    )
  ) {
    return "lifestyle";
  }
  return "general";
};

export const runDiscoverAffiliateProduct = async (
  payload: JobPayload,
): Promise<Record<string, unknown>> => {
  const clipCandidateId =
    typeof payload.clipCandidateId === "string"
      ? payload.clipCandidateId
      : undefined;
  const workspaceId =
    typeof payload.workspaceId === "string" ? payload.workspaceId : "";

  if (clipCandidateId === undefined || workspaceId === "") {
    throw new Error("clipCandidateId and workspaceId required");
  }

  const settingsRow = await prisma.workspaceOverlaySettings.findUnique({
    where: { workspaceId },
  });

  if (settingsRow === null || settingsRow.aiProductDiscoveryEnabled !== true) {
    throw new Error("AI product discovery is disabled for this workspace");
  }

  const affiliateSettings = mapWorkspaceAffiliateSettings(settingsRow);

  const clip = await prisma.clipCandidate.findUnique({
    where: { id: clipCandidateId },
    include: {
      sourceVideo: {
        include: {
          transcriptSegments: { orderBy: { startMs: "asc" } },
        },
      },
    },
  });

  if (clip === null) {
    throw new Error("Clip not found");
  }

  const segmentsInClip = clip.sourceVideo.transcriptSegments
    .filter((seg) => seg.endMs > clip.startMs && seg.startMs < clip.endMs)
    .map((seg) => ({
      startMs: seg.startMs,
      endMs: seg.endMs,
      text: seg.text,
    }));

  const aiResult = await discoverAmazonProductWithAi({
    suggestedTitle: clip.suggestedTitle,
    suggestedHook: clip.suggestedHook,
    suggestedCaption: clip.suggestedCaption,
    suggestedHashtags: clip.suggestedHashtags ?? [],
    transcriptExcerpt: clip.transcriptExcerpt,
    transcriptSegments: segmentsInClip,
  });

  const parsedAi = aiProductDiscoveryResultSchema.parse(aiResult);
  const category = inferCategory(parsedAi);

  const resolved = await resolveAffiliateProductChain({
    searchQuery: parsedAi.searchQuery,
    productTitle: parsedAi.productTitle,
    category,
    settings: affiliateSettings,
  });

  const disclosure =
    affiliateSettings.defaultDisclosureText ??
    "Links may earn a commission. #ad";

  let productLink = resolved.externalProductId
    ? await prisma.productLink.findFirst({
        where: {
          workspaceId,
          affiliateNetwork: resolved.network,
          externalProductId: resolved.externalProductId,
          active: true,
        },
      })
    : null;

  let reusedCatalog = false;

  if (productLink === null) {
    productLink = await prisma.productLink.create({
      data: {
        workspaceId,
        title: resolved.productTitle,
        url: resolved.productUrl,
        imageUrl: resolved.imageUrl,
        priceLabel: resolved.priceLabel,
        affiliateNetwork: resolved.network,
        externalProductId: resolved.externalProductId,
        disclosureText: disclosure,
        active: true,
      },
    });
  } else {
    reusedCatalog = true;
    productLink = await prisma.productLink.update({
      where: { id: productLink.id },
      data: {
        title: resolved.productTitle,
        url: resolved.productUrl,
        imageUrl: resolved.imageUrl ?? productLink.imageUrl,
        priceLabel: resolved.priceLabel ?? productLink.priceLabel,
      },
    });
  }

  let imageStorageKey: string | null = productLink.imageStorageKey;
  if (
    imageStorageKey === null &&
    resolved.imageUrl !== undefined &&
    resolved.imageUrl !== ""
  ) {
    imageStorageKey = await uploadProductImageFromUrl({
      imageUrl: resolved.imageUrl,
      workspaceId,
      productLinkId: productLink.id,
    });
    if (imageStorageKey !== null) {
      productLink = await prisma.productLink.update({
        where: { id: productLink.id },
        data: { imageStorageKey },
      });
    }
  }

  const replaceExisting =
    payload.replaceExistingDraft === true ||
    payload.replaceExistingDraft === "true";

  if (replaceExisting) {
    await prisma.clipOverlay.deleteMany({
      where: {
        clipCandidateId,
        isDraft: true,
        overlayType: "product_pin",
      },
    });
  }

  const window = findOverlayWindow(
    clip.startMs,
    clip.endMs,
    segmentsInClip,
    parsedAi.placementHint,
  );

  const overlay = await prisma.clipOverlay.create({
    data: {
      clipCandidateId,
      overlayType: "product_pin",
      productLinkId: productLink.id,
      startMs: window.startMs,
      endMs: window.endMs,
      position: { anchor: "bottom_right", marginPx: 80 } as Prisma.InputJsonValue,
      style: {
        title: resolved.productTitle,
        cta: resolved.ctaLabel,
      } as Prisma.InputJsonValue,
      compliance: "affiliate",
      sortOrder: 0,
      isDraft: true,
    },
  });

  return {
    productLinkId: productLink.id,
    overlayId: overlay.id,
    productUrl: resolved.productUrl,
    searchQuery: parsedAi.searchQuery,
    productTitle: resolved.productTitle,
    rationale: parsedAi.rationale,
    affiliateNetwork: resolved.network,
    usedProductApi: resolved.usedProductApi,
    externalProductId: resolved.externalProductId,
    attemptedNetworks: resolved.attemptedNetworks,
    imageStorageKey: imageStorageKey ?? undefined,
    reusedCatalog,
  };
};
