export type PublishOverlayLink = {
  title: string;
  url: string;
  trackedUrl?: string;
};

export type BuildPublishDescriptionInput = {
  caption?: string | null;
  hashtags?: string[];
  disclosureBlock?: string | null;
  links?: PublishOverlayLink[];
};

export const appendUtmParams = (
  url: string,
  renderedClipId: string,
  workspaceSlug?: string,
): string => {
  try {
    const parsed = new URL(url);
    parsed.searchParams.set("utm_source", "clipforge");
    parsed.searchParams.set("utm_medium", "short");
    parsed.searchParams.set("utm_campaign", renderedClipId);
    if (workspaceSlug !== undefined && workspaceSlug !== "") {
      parsed.searchParams.set("utm_content", workspaceSlug);
    }
    return parsed.toString();
  } catch {
    return url;
  }
};

export const buildPublishDescription = (
  input: BuildPublishDescriptionInput,
): { description: string; linksText: string } => {
  const parts: string[] = [];

  if (input.disclosureBlock !== undefined && input.disclosureBlock !== null && input.disclosureBlock !== "") {
    parts.push(input.disclosureBlock);
  }

  if (input.caption !== undefined && input.caption !== null && input.caption !== "") {
    parts.push(input.caption);
  }

  const linkLines: string[] = [];
  if (input.links !== undefined) {
    for (const link of input.links) {
      const href = link.trackedUrl ?? link.url;
      linkLines.push(`${link.title}: ${href}`);
    }
    if (linkLines.length > 0) {
      parts.push("Links:");
      parts.push(...linkLines);
    }
  }

  const hashtagLine =
    input.hashtags !== undefined && input.hashtags.length > 0
      ? input.hashtags.map((h) => (h.startsWith("#") ? h : `#${h}`)).join(" ")
      : "";

  if (hashtagLine !== "") {
    parts.push(hashtagLine);
  }

  const description = parts.filter((p) => p !== "").join("\n\n");
  const linksText = linkLines.join("\n");

  return { description, linksText };
};
