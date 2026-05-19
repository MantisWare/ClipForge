export type SourceMetadata = {
  title?: string;
  description?: string;
  thumbnailUrl?: string;
  durationSeconds?: number;
  width?: number;
  height?: number;
  fps?: number;
  language?: string;
  channelName?: string;
};

export type ProbeResult = {
  durationSeconds?: number;
  width?: number;
  height?: number;
  fps?: number;
};
