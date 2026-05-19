import { getClipScoringConfig } from "../config/clip-scoring.js";
import type { ClipWindow } from "../types/clip-window.js";
import type { TranscriptSegmentInput, TranscriptWordInput } from "./types.js";

const snapToBoundary = (
  ms: number,
  segments: TranscriptSegmentInput[],
  edge: "start" | "end",
): number => {
  if (segments.length === 0) {
    return ms;
  }

  let best = ms;
  let bestDist = Number.POSITIVE_INFINITY;

  for (const seg of segments) {
    const candidate = edge === "start" ? seg.startMs : seg.endMs;
    const dist = Math.abs(candidate - ms);
    if (dist < bestDist) {
      bestDist = dist;
      best = candidate;
    }
  }

  return best;
};

const wordsInRange = (
  segments: TranscriptSegmentInput[],
  startMs: number,
  endMs: number,
): TranscriptWordInput[] => {
  const words: TranscriptWordInput[] = [];
  for (const seg of segments) {
    if (seg.endMs <= startMs || seg.startMs >= endMs) {
      continue;
    }
    for (const w of seg.words) {
      if (w.startMs >= startMs && w.endMs <= endMs) {
        words.push(w);
      }
    }
  }
  if (words.length > 0) {
    return words;
  }

  for (const seg of segments) {
    if (seg.endMs > startMs && seg.startMs < endMs) {
      return [];
    }
  }
  return [];
};

const buildExcerpt = (
  segments: TranscriptSegmentInput[],
  startMs: number,
  endMs: number,
): string => {
  const words = wordsInRange(segments, startMs, endMs);
  if (words.length > 0) {
    return words.map((w) => w.word).join(" ").trim();
  }

  const parts: string[] = [];
  for (const seg of segments) {
    if (seg.endMs > startMs && seg.startMs < endMs) {
      parts.push(seg.text);
    }
  }
  return parts.join(" ").trim();
};

export const generateClipWindows = (
  segments: TranscriptSegmentInput[],
  sourceDurationMs: number,
): ClipWindow[] => {
  const config = getClipScoringConfig();
  if (segments.length === 0 || sourceDurationMs <= 0) {
    return [];
  }

  const durationSec = sourceDurationMs / 1000;
  const stepMs =
    durationSec < config.shortVideoThresholdSec
      ? config.stepMsShort
      : config.stepMsLong;

  const seen = new Set<string>();
  const windows: ClipWindow[] = [];

  for (const durationSecWindow of config.windowDurationsSec) {
    const windowMs = durationSecWindow * 1000;
    if (windowMs > sourceDurationMs) {
      continue;
    }

    for (let start = 0; start + windowMs <= sourceDurationMs; start += stepMs) {
      let end = start + windowMs;
      start = snapToBoundary(start, segments, "start");
      end = snapToBoundary(end, segments, "end");

      if (end <= start) {
        continue;
      }

      const key = `${start}-${end}`;
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);

      const excerpt = buildExcerpt(segments, start, end);
      if (excerpt.length < 20) {
        continue;
      }

      windows.push({
        id: `w_${start}_${end}`,
        startMs: start,
        endMs: end,
        durationSeconds: (end - start) / 1000,
        transcriptExcerpt: excerpt,
      });
    }
  }

  return windows;
};
