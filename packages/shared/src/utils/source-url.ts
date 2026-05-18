export type ParsedSourceType = "youtube" | "vimeo" | "direct_url";

export type ParsedSource = {
  sourceType: ParsedSourceType;
  sourceUrl: string;
  sourcePlatformId?: string;
};

const YOUTUBE_PATTERNS = [
  /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
];

const VIMEO_PATTERN = /vimeo\.com\/(\d+)/;

const VIDEO_EXTENSIONS = [".mp4", ".mov", ".webm", ".mkv", ".m4v"];

export const parseSourceUrl = (url: string): ParsedSource | null => {
  try {
    const parsed = new URL(url);

    for (const pattern of YOUTUBE_PATTERNS) {
      const match = url.match(pattern);
      if (match?.[1] !== undefined) {
        return {
          sourceType: "youtube",
          sourceUrl: url,
          sourcePlatformId: match[1],
        };
      }
    }

    const vimeoMatch = url.match(VIMEO_PATTERN);
    if (vimeoMatch?.[1] !== undefined) {
      return {
        sourceType: "vimeo",
        sourceUrl: url,
        sourcePlatformId: vimeoMatch[1],
      };
    }

    const pathname = parsed.pathname.toLowerCase();
    const isDirectVideo = VIDEO_EXTENSIONS.some((ext) =>
      pathname.endsWith(ext),
    );

    if (isDirectVideo) {
      return {
        sourceType: "direct_url",
        sourceUrl: url,
      };
    }

    if (
      parsed.protocol === "http:" ||
      parsed.protocol === "https:"
    ) {
      return {
        sourceType: "direct_url",
        sourceUrl: url,
      };
    }

    return null;
  } catch {
    return null;
  }
};
