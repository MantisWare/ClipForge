export type TranscriptWordDto = {
  word: string;
  startMs: number;
  endMs: number;
  confidence?: number;
};

export type TranscriptSegmentDto = {
  startMs: number;
  endMs: number;
  text: string;
  confidence?: number;
  speakerLabel?: string;
  words?: TranscriptWordDto[];
};

export type TranscribeApiResponse = {
  language: string;
  segments: TranscriptSegmentDto[];
};
