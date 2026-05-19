import {
  appendUtmParams,
  buildPublishDescription,
} from "@clipforge/shared";
import { prisma } from "@clipforge/database";

export const buildPublishMetadataForRendered = async (
  renderedClipId: string,
  workspaceId: string,
  caption?: string | null,
  hashtags?: string[],
) => {
  const rendered = await prisma.renderedClip.findUnique({
    where: { id: renderedClipId },
    include: {
      clipCandidate: {
        include: {
          clipOverlays: {
            where: { isDraft: false },
            include: { productLink: true },
          },
        },
      },
    },
  });

  const settings = await prisma.workspaceOverlaySettings.findUnique({
    where: { workspaceId },
  });

  const overlays = rendered?.clipCandidate.clipOverlays ?? [];
  const links = overlays
    .map((o) => o.productLink)
    .filter((p): p is NonNullable<typeof p> => p !== null)
    .map((p) => ({
      title: p.title,
      url: p.url,
      trackedUrl: appendUtmParams(p.url, renderedClipId, workspaceId),
    }));

  const disclosureParts: string[] = [];
  if (
    settings?.defaultDisclosureText !== undefined &&
    settings.defaultDisclosureText !== null &&
    settings.defaultDisclosureText !== ""
  ) {
    disclosureParts.push(settings.defaultDisclosureText);
  }

  const { description, linksText } = buildPublishDescription({
    disclosureBlock:
      disclosureParts.length > 0 ? disclosureParts.join("\n") : null,
    caption:
      caption ??
      rendered?.clipCandidate.suggestedCaption ??
      null,
    hashtags: hashtags ?? rendered?.clipCandidate.suggestedHashtags ?? [],
    links,
  });

  return { description, linksText, hasAffiliateOverlays: links.length > 0 };
};
