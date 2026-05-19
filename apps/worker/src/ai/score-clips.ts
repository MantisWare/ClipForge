import {
  generateClipWindows,
  getClipScoringConfig,
  rankWindowsByHeuristic,
  scoreAllWindowsHeuristic,
  type ClipWindow,
  type HeuristicScore,
  type LlmClipScore,
  type TranscriptSegmentInput,
} from "@clipforge/shared";
import { prisma, SourceStatus } from "@clipforge/database";
import { scoreClipsWithAi } from "../lib/worker-ai-client.js";

export type ScoreClipsPayload = {
  sourceVideoId: string;
  workspaceId: string;
  clipCount?: number;
};

const clampMs = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

const platformFitAverage = (fit: {
  youtubeShorts: number;
  tiktok: number;
  instagramReels: number;
}): number =>
  Math.round((fit.youtubeShorts + fit.tiktok + fit.instagramReels) / 3);

const heuristicToLlmScore = (
  window: ClipWindow,
  h: HeuristicScore,
): LlmClipScore => {
  const title =
    window.transcriptExcerpt.split(".")[0]?.trim().slice(0, 80) ??
    "Clip idea";
  return {
    windowId: window.id,
    overallScore: h.compositeScore,
    hookScore: h.hookScore,
    standaloneScore: h.standaloneScore,
    retentionScore: h.compositeScore,
    platformFit: {
      youtubeShorts: 60,
      tiktok: 60,
      instagramReels: 60,
    },
    suggestedStartAdjustmentMs: 0,
    suggestedEndAdjustmentMs: 0,
    suggestedHook: title,
    suggestedTitle: title,
    suggestedCaption: window.transcriptExcerpt.slice(0, 280),
    suggestedHashtags: ["shorts", "clip", "viral"],
    reasonSelected: "Ranked by heuristic signals (LLM unavailable).",
    warnings: [],
  };
};

export const runScoreClips = async (payload: ScoreClipsPayload): Promise<void> => {
  const config = getClipScoringConfig();
  const clipCount = payload.clipCount ?? config.defaultClipCount;
  const { sourceVideoId } = payload;

  const source = await prisma.sourceVideo.findUnique({
    where: { id: sourceVideoId },
    include: {
      transcriptSegments: {
        orderBy: { startMs: "asc" },
        include: { words: { orderBy: { startMs: "asc" } } },
      },
    },
  });

  if (source === null) {
    throw new Error(`Source video not found: ${sourceVideoId}`);
  }

  if (source.transcriptSegments.length === 0) {
    throw new Error("Transcript required before generating clip candidates");
  }

  const sourceDurationMs = Math.round(
    (source.durationSeconds ?? 0) * 1000,
  );
  if (sourceDurationMs <= 0) {
    throw new Error("Source duration unknown — cannot generate windows");
  }

  const segments: TranscriptSegmentInput[] = source.transcriptSegments.map(
    (s) => ({
      id: s.id,
      startMs: s.startMs,
      endMs: s.endMs,
      text: s.text,
      words: s.words.map((w) => ({
        word: w.word,
        startMs: w.startMs,
        endMs: w.endMs,
      })),
    }),
  );

  await prisma.sourceVideo.update({
    where: { id: sourceVideoId },
    data: { status: SourceStatus.analyzing },
  });

  try {
    const allWindows = generateClipWindows(segments, sourceDurationMs);
    if (allWindows.length === 0) {
      throw new Error("No valid clip windows generated from transcript");
    }

    const heuristicScores = scoreAllWindowsHeuristic(allWindows, segments);
    const topWindows = rankWindowsByHeuristic(allWindows, heuristicScores);
    const heuristicMap = new Map(
      heuristicScores.map((h) => [h.windowId, h]),
    );

    let llmScores: LlmClipScore[];
    try {
      const aiResult = await scoreClipsWithAi(topWindows);
      llmScores = aiResult.scores.map((s) => ({
        ...s,
        windowId: s.windowId,
      }));
    } catch {
      llmScores = topWindows.map((w) => {
        const h = heuristicMap.get(w.id);
        if (h === undefined) {
          throw new Error(`Missing heuristic for window ${w.id}`);
        }
        return heuristicToLlmScore(w, h);
      });
    }

    const windowMap = new Map(topWindows.map((w) => [w.id, w]));
    const merged = llmScores
      .map((score) => {
        const window = windowMap.get(score.windowId);
        if (window === undefined) {
          return null;
        }
        const startMs = clampMs(
          window.startMs + score.suggestedStartAdjustmentMs,
          0,
          sourceDurationMs,
        );
        let endMs = clampMs(
          window.endMs + score.suggestedEndAdjustmentMs,
          startMs + 5_000,
          sourceDurationMs,
        );
        if (endMs <= startMs) {
          endMs = Math.min(sourceDurationMs, startMs + 30_000);
        }

        return {
          sourceVideoId,
          startMs,
          endMs,
          durationSeconds: (endMs - startMs) / 1000,
          transcriptExcerpt: window.transcriptExcerpt,
          hookScore: score.hookScore,
          viralityScore: score.retentionScore,
          clarityScore: score.standaloneScore,
          standaloneScore: score.standaloneScore,
          platformFitScore: platformFitAverage(score.platformFit),
          overallScore: score.overallScore,
          reasonSelected: score.reasonSelected,
          suggestedHook: score.suggestedHook,
          suggestedTitle: score.suggestedTitle,
          suggestedCaption: score.suggestedCaption,
          suggestedHashtags: score.suggestedHashtags,
        };
      })
      .filter((row): row is NonNullable<typeof row> => row !== null)
      .sort((a, b) => b.overallScore - a.overallScore)
      .slice(0, clipCount);

    await prisma.$transaction(async (tx) => {
      await tx.clipCandidate.deleteMany({ where: { sourceVideoId } });
      if (merged.length > 0) {
        await tx.clipCandidate.createMany({ data: merged });
      }
      await tx.sourceVideo.update({
        where: { id: sourceVideoId },
        data: { status: SourceStatus.ready },
      });
    });
  } catch (error) {
    await prisma.sourceVideo.update({
      where: { id: sourceVideoId },
      data: { status: SourceStatus.failed },
    });
    throw error;
  }
};
