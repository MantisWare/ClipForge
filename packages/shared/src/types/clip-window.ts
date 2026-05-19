export type ClipWindow = {
  id: string;
  startMs: number;
  endMs: number;
  durationSeconds: number;
  transcriptExcerpt: string;
};

export type HeuristicScore = {
  windowId: string;
  compositeScore: number;
  hookScore: number;
  completenessScore: number;
  densityScore: number;
  standaloneScore: number;
};

export type LlmPlatformFit = {
  youtubeShorts: number;
  tiktok: number;
  instagramReels: number;
};

export type LlmClipScore = {
  windowId: string;
  overallScore: number;
  hookScore: number;
  standaloneScore: number;
  retentionScore: number;
  platformFit: LlmPlatformFit;
  suggestedStartAdjustmentMs: number;
  suggestedEndAdjustmentMs: number;
  suggestedHook: string;
  suggestedTitle: string;
  suggestedCaption: string;
  suggestedHashtags: string[];
  reasonSelected: string;
  warnings: string[];
};

export type ScoreClipsRequest = {
  windows: ClipWindow[];
  model?: string;
};

export type ScoreClipsResponse = {
  scores: LlmClipScore[];
  heuristicOnly: boolean;
};
