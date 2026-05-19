import type { SourceMetadata } from "../types/source-metadata.js";

type YouTubeApiItem = {
  snippet?: {
    title?: string;
    description?: string;
    channelTitle?: string;
    defaultLanguage?: string;
    thumbnails?: {
      high?: { url?: string };
      medium?: { url?: string };
      default?: { url?: string };
    };
  };
  contentDetails?: {
    duration?: string;
  };
};

const parseIso8601Duration = (iso: string): number | undefined => {
  const match = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/i.exec(iso);
  if (match === null) {
    return undefined;
  }
  const hours = Number.parseInt(match[1] ?? "0", 10);
  const minutes = Number.parseInt(match[2] ?? "0", 10);
  const seconds = Number.parseInt(match[3] ?? "0", 10);
  return hours * 3600 + minutes * 60 + seconds;
};

export const fetchYouTubeMetadata = async (
  videoId: string,
  apiKey: string,
): Promise<SourceMetadata> => {
  const params = new URLSearchParams({
    part: "snippet,contentDetails",
    id: videoId,
    key: apiKey,
  });

  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?${params.toString()}`,
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`YouTube API error: ${res.status} ${text}`);
  }

  const data = (await res.json()) as { items?: YouTubeApiItem[] };
  const item = data.items?.[0];
  if (item === undefined) {
    throw new Error("Video not found on YouTube");
  }

  const thumb =
    item.snippet?.thumbnails?.high?.url ??
    item.snippet?.thumbnails?.medium?.url ??
    item.snippet?.thumbnails?.default?.url;

  const durationRaw = item.contentDetails?.duration;
  const durationSeconds =
    durationRaw !== undefined
      ? parseIso8601Duration(durationRaw)
      : undefined;

  return {
    title: item.snippet?.title,
    description: item.snippet?.description,
    thumbnailUrl: thumb,
    durationSeconds,
    channelName: item.snippet?.channelTitle,
    language: item.snippet?.defaultLanguage,
  };
};
