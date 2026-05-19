export type ClipScoringConfig = {
  autoGenerateClips: boolean;
  openaiModel: string;
  windowDurationsSec: number[];
  stepMsShort: number;
  stepMsLong: number;
  shortVideoThresholdSec: number;
  heuristicTopK: number;
  defaultClipCount: number;
  minSpeechDensity: number;
};

const parseBool = (value: string | undefined, defaultValue: boolean): boolean => {
  if (value === undefined || value === "") {
    return defaultValue;
  }
  const lower = value.toLowerCase();
  if (lower === "true" || lower === "1") {
    return true;
  }
  if (lower === "false" || lower === "0") {
    return false;
  }
  return defaultValue;
};

export const getClipScoringConfig = (): ClipScoringConfig => ({
  autoGenerateClips: parseBool(process.env.AUTO_GENERATE_CLIPS, false),
  openaiModel: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
  windowDurationsSec: [30, 45, 60],
  stepMsShort: 5_000,
  stepMsLong: 10_000,
  shortVideoThresholdSec: 600,
  heuristicTopK: 25,
  defaultClipCount: 10,
  minSpeechDensity: 0.15,
});
