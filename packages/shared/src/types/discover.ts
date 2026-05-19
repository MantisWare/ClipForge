export type DiscoverVideoItem = {
  id: string;
  title: string;
  channel: string;
  channelId?: string;
  thumbnailUrl: string | null;
  duration: string;
  durationSeconds?: number;
  viewCount?: number;
  publishedAt: string;
  sourceUrl: string;
  rightsStatus: "owned" | "licensed" | "permission_required" | "unknown";
};
