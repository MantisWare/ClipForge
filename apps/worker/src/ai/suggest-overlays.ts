import { prisma, type Prisma } from "@clipforge/database";
import type { JobPayload } from "../handlers/types.js";

const findSentenceBounds = (
  text: string,
  productTitle: string,
): { startMs: number; endMs: number } | null => {
  const lower = text.toLowerCase();
  const idx = lower.indexOf(productTitle.toLowerCase());
  if (idx < 0) {
    return null;
  }
  return { startMs: 0, endMs: 0 };
};

export const runSuggestOverlays = async (payload: JobPayload) => {
  const clipCandidateId =
    typeof payload.clipCandidateId === "string"
      ? payload.clipCandidateId
      : undefined;
  const workspaceId =
    typeof payload.workspaceId === "string" ? payload.workspaceId : "";

  if (clipCandidateId === undefined) {
    throw new Error("clipCandidateId required for ai.suggest_overlays");
  }

  const clip = await prisma.clipCandidate.findUnique({
    where: { id: clipCandidateId },
    include: {
      sourceVideo: {
        include: {
          transcriptSegments: { orderBy: { startMs: "asc" } },
        },
      },
      clipOverlays: true,
    },
  });

  if (clip === null) {
    throw new Error("Clip not found");
  }

  const products = await prisma.productLink.findMany({
    where: { workspaceId, active: true },
  });

  const clipDurationMs = clip.endMs - clip.startMs;
  const drafts: Prisma.ClipOverlayCreateManyInput[] = [];

  for (const product of products.slice(0, 3)) {
    const excerpt = clip.transcriptExcerpt;
    if (!excerpt.toLowerCase().includes(product.title.toLowerCase())) {
      continue;
    }

    const segment = clip.sourceVideo.transcriptSegments.find((seg) =>
      seg.text.toLowerCase().includes(product.title.toLowerCase()),
    );

    let startMs = Math.max(clip.startMs, clip.startMs + 2000);
    let endMs = Math.min(clip.endMs, startMs + 6000);

    if (segment !== undefined) {
      startMs = segment.startMs - clip.startMs;
      endMs = Math.min(clipDurationMs, segment.endMs - clip.startMs + 500);
    } else {
      startMs = Math.min(clipDurationMs - 6000, 2000);
      endMs = Math.min(clipDurationMs, startMs + 6000);
    }

    findSentenceBounds(excerpt, product.title);

    drafts.push({
      clipCandidateId,
      overlayType: "product_pin",
      productLinkId: product.id,
      startMs: Math.max(0, startMs),
      endMs: Math.max(startMs + 1000, endMs),
      position: { anchor: "bottom_right", marginPx: 80 } as Prisma.InputJsonValue,
      style: { cta: "Shop", title: product.title } as Prisma.InputJsonValue,
      compliance: product.affiliateNetwork !== null ? "affiliate" : "none",
      sortOrder: drafts.length,
      isDraft: true,
    });

    if (drafts.length >= 2) {
      break;
    }
  }

  drafts.push({
    clipCandidateId,
    overlayType: "end_slate",
    startMs: Math.max(0, clipDurationMs - 3000),
    endMs: clipDurationMs,
    position: { anchor: "center", marginPx: 80 } as Prisma.InputJsonValue,
    style: {
      headline: clip.suggestedHook ?? "Follow for more",
      cta: "Link in bio",
    } as Prisma.InputJsonValue,
    compliance: "none",
    sortOrder: drafts.length,
    isDraft: true,
  });

  if (drafts.length > 0) {
    await prisma.clipOverlay.createMany({ data: drafts });
  }
};

export const handleSuggestOverlays = async (payload: JobPayload) => {
  await runSuggestOverlays(payload);
};
