import { getClipScoringConfig } from "../config/clip-scoring.js";
import type { ClipWindow } from "../types/clip-window.js";
import type { HeuristicScore } from "../types/clip-window.js";
import type { TranscriptSegmentInput } from "./types.js";

const HOOK_PHRASES = [
  "here's the thing",
  "the truth is",
  "you won't believe",
  "secret",
  "mistake",
  "why",
  "how to",
  "never",
  "always",
  "biggest",
  "stop",
  "start",
  "watch",
  "listen",
];

const EMOTIONAL_WORDS = [
  "amazing",
  "incredible",
  "shocking",
  "love",
  "hate",
  "fear",
  "excited",
  "angry",
  "happy",
  "sad",
  "wow",
];

const scoreHookPhrases = (text: string): number => {
  const lower = text.toLowerCase();
  let hits = 0;
  for (const phrase of HOOK_PHRASES) {
    if (lower.includes(phrase)) {
      hits += 1;
    }
  }
  return Math.min(100, hits * 20);
};

const scoreQuestions = (text: string): number => {
  const matches = text.match(/\?/g);
  const count = matches?.length ?? 0;
  return Math.min(100, count * 35);
};

const scoreNumbers = (text: string): number => {
  const matches = text.match(/\d+/g);
  const count = matches?.length ?? 0;
  return Math.min(100, count * 25);
};

const scoreEmotional = (text: string): number => {
  const lower = text.toLowerCase();
  let hits = 0;
  for (const word of EMOTIONAL_WORDS) {
    if (lower.includes(word)) {
      hits += 1;
    }
  }
  return Math.min(100, hits * 20);
};

const scoreCompleteness = (text: string): number => {
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return 0;
  }
  const startsWell = /^[A-Z"']/.test(trimmed) || /^[a-z]/.test(trimmed);
  const endsWell = /[.!?]$/.test(trimmed);
  let score = 50;
  if (startsWell) {
    score += 25;
  }
  if (endsWell) {
    score += 25;
  }
  return score;
};

const scoreStandalone = (text: string): number => {
  const lower = text.toLowerCase();
  const dependencyPhrases = [
    "as i said",
    "like i mentioned",
    "earlier",
    "before",
    "next",
    "continuing",
  ];
  let penalty = 0;
  for (const phrase of dependencyPhrases) {
    if (lower.includes(phrase)) {
      penalty += 15;
    }
  }
  return Math.max(0, 100 - penalty);
};

const scoreDensity = (
  window: ClipWindow,
  segments: TranscriptSegmentInput[],
): number => {
  const config = getClipScoringConfig();
  const windowDuration = window.endMs - window.startMs;
  if (windowDuration <= 0) {
    return 0;
  }

  let speechMs = 0;
  for (const seg of segments) {
    if (seg.endMs <= window.startMs || seg.startMs >= window.endMs) {
      continue;
    }
    const overlapStart = Math.max(seg.startMs, window.startMs);
    const overlapEnd = Math.min(seg.endMs, window.endMs);
    speechMs += overlapEnd - overlapStart;
  }

  const density = speechMs / windowDuration;
  if (density < config.minSpeechDensity) {
    return density * 100;
  }
  return Math.min(100, density * 120);
};

export const scoreWindowHeuristic = (
  window: ClipWindow,
  segments: TranscriptSegmentInput[],
): HeuristicScore => {
  const text = window.transcriptExcerpt;
  const hookScore = Math.max(
    scoreHookPhrases(text),
    scoreQuestions(text),
    scoreNumbers(text),
    scoreEmotional(text),
  );
  const completenessScore = scoreCompleteness(text);
  const densityScore = scoreDensity(window, segments);
  const standaloneScore = scoreStandalone(text);

  const compositeScore =
    hookScore * 0.3 +
    completenessScore * 0.2 +
    densityScore * 0.25 +
    standaloneScore * 0.25;

  return {
    windowId: window.id,
    compositeScore: Math.round(compositeScore * 10) / 10,
    hookScore,
    completenessScore,
    densityScore,
    standaloneScore,
  };
};

export const scoreAllWindowsHeuristic = (
  windows: ClipWindow[],
  segments: TranscriptSegmentInput[],
): HeuristicScore[] =>
  windows.map((w) => scoreWindowHeuristic(w, segments));
