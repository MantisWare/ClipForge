import { parseIso8601Duration } from "./youtube-duration.js";
import type { DiscoverVideoItem } from "../types/discover.js";

type YouTubeSearchItem = {
  id?: { videoId?: string };
  snippet?: {
    title?: string;
    channelTitle?: string;
    channelId?: string;
    publishedAt?: string;
    thumbnails?: {
      high?: { url?: string };
      medium?: { url?: string };
      default?: { url?: string };
    };
  };
};

type YouTubeVideoItem = {
  id?: string;
  snippet?: YouTubeSearchItem["snippet"];
  contentDetails?: { duration?: string };
  statistics?: { viewCount?: string };
};

const mapVideo = (video: YouTubeVideoItem): DiscoverVideoItem | null => {
  const id = video.id;
  if (id === undefined || id === "") {
    return null;
  }
  const thumb =
    video.snippet?.thumbnails?.high?.url ??
    video.snippet?.thumbnails?.medium?.url ??
    video.snippet?.thumbnails?.default?.url ??
    null;
  const durationRaw = video.contentDetails?.duration;
  const durationSeconds =
    durationRaw !== undefined ? parseIso8601Duration(durationRaw) : undefined;
  const duration =
    durationSeconds !== undefined
      ? formatDuration(durationSeconds)
      : "—";

  return {
    id,
    title: video.snippet?.title ?? "Untitled",
    channel: video.snippet?.channelTitle ?? "Unknown",
    channelId: video.snippet?.channelId,
    thumbnailUrl: thumb,
    duration,
    durationSeconds,
    viewCount:
      video.statistics?.viewCount !== undefined
        ? Number.parseInt(video.statistics.viewCount, 10)
        : undefined,
    publishedAt: video.snippet?.publishedAt ?? new Date().toISOString(),
    sourceUrl: `https://www.youtube.com/watch?v=${id}`,
    rightsStatus: "permission_required",
  };
};

const formatYouTubeApiError = async (
  operation: string,
  res: Response,
): Promise<string> => {
  let detail = "";
  try {
    const body = (await res.json()) as {
      error?: { message?: string; errors?: Array<{ reason?: string }> };
    };
    detail = body.error?.message ?? "";
    const reason = body.error?.errors?.[0]?.reason;
    if (reason !== undefined && reason !== "") {
      detail = detail !== "" ? `${detail} (${reason})` : reason;
    }
  } catch {
    detail = await res.text();
  }
  if (res.status === 403 && detail.includes("has not been used")) {
    return `YouTube Data API v3 is not enabled for this API key. Enable it in Google Cloud Console, then retry.`;
  }
  if (res.status === 403) {
    return `YouTube API denied the request (${operation}): ${detail || res.statusText}`;
  }
  return `YouTube ${operation} failed (${res.status}): ${detail || res.statusText}`;
};

const formatDuration = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
};

const fetchVideoDetails = async (
  videoIds: string[],
  apiKey: string,
): Promise<Map<string, YouTubeVideoItem>> => {
  if (videoIds.length === 0) {
    return new Map();
  }
  const params = new URLSearchParams({
    part: "snippet,contentDetails,statistics",
    id: videoIds.join(","),
    key: apiKey,
  });
  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?${params.toString()}`,
  );
  if (!res.ok) {
    throw new Error(await formatYouTubeApiError("videos.list", res));
  }
  const data = (await res.json()) as { items?: YouTubeVideoItem[] };
  const map = new Map<string, YouTubeVideoItem>();
  for (const item of data.items ?? []) {
    if (item.id !== undefined) {
      map.set(item.id, item);
    }
  }
  return map;
};

export const fetchYouTubeSearch = async (
  apiKey: string,
  options: {
    keyword: string;
    region?: string;
    maxResults?: number;
  },
): Promise<DiscoverVideoItem[]> => {
  const params = new URLSearchParams({
    part: "snippet",
    type: "video",
    q: options.keyword,
    maxResults: String(options.maxResults ?? 20),
    key: apiKey,
  });
  if (options.region !== undefined && options.region !== "") {
    params.set("regionCode", options.region);
  }

  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/search?${params.toString()}`,
  );
  if (!res.ok) {
    throw new Error(await formatYouTubeApiError("search", res));
  }

  const data = (await res.json()) as { items?: YouTubeSearchItem[] };
  const videoIds = (data.items ?? [])
    .map((i) => i.id?.videoId)
    .filter((id): id is string => id !== undefined && id !== "");

  const details = await fetchVideoDetails(videoIds, apiKey);
  return videoIds
    .map((id) => {
      const detail = details.get(id) ?? { id, snippet: data.items?.find((i) => i.id?.videoId === id)?.snippet };
      return mapVideo(detail);
    })
    .filter((item): item is DiscoverVideoItem => item !== null);
};

export const fetchYouTubeMostPopular = async (
  apiKey: string,
  options: {
    region?: string;
    categoryId?: string;
    maxResults?: number;
  },
): Promise<DiscoverVideoItem[]> => {
  const params = new URLSearchParams({
    part: "snippet,contentDetails,statistics",
    chart: "mostPopular",
    maxResults: String(options.maxResults ?? 20),
    key: apiKey,
  });
  if (options.region !== undefined && options.region !== "") {
    params.set("regionCode", options.region);
  }
  if (options.categoryId !== undefined && options.categoryId !== "") {
    params.set("videoCategoryId", options.categoryId);
  }

  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?${params.toString()}`,
  );
  if (!res.ok) {
    throw new Error(await formatYouTubeApiError("mostPopular", res));
  }

  const data = (await res.json()) as { items?: YouTubeVideoItem[] };
  return (data.items ?? [])
    .map(mapVideo)
    .filter((item): item is DiscoverVideoItem => item !== null);
};
