import { getClipScoringConfig } from "../config/clip-scoring.js";
import type { ClipWindow } from "../types/clip-window.js";
import type { HeuristicScore } from "../types/clip-window.js";

export const rankWindowsByHeuristic = (
  windows: ClipWindow[],
  scores: HeuristicScore[],
): ClipWindow[] => {
  const config = getClipScoringConfig();
  const scoreMap = new Map(scores.map((s) => [s.windowId, s.compositeScore]));

  return [...windows]
    .sort((a, b) => {
      const sa = scoreMap.get(a.id) ?? 0;
      const sb = scoreMap.get(b.id) ?? 0;
      return sb - sa;
    })
    .slice(0, config.heuristicTopK);
};
