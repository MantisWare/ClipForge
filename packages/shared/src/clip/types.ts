export type TranscriptWordInput = {
  word: string;
  startMs: number;
  endMs: number;
};

export type TranscriptSegmentInput = {
  id: string;
  startMs: number;
  endMs: number;
  text: string;
  words: TranscriptWordInput[];
};
