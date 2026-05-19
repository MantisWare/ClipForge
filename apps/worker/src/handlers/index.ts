import type { JobTypeName } from "@clipforge/shared";
import { handleAnalyticsRollup } from "./analytics-rollup.js";
import { handleBatchRender } from "./batch-render.js";
import { handlePublish } from "./publish.js";
import { handlePublishScheduled } from "./publish-scheduled.js";
import { handleRenderClip } from "./render-clip.js";
import { handleRenderApplyOverlays } from "./render-apply-overlays.js";
import { handleSuggestOverlays } from "./suggest-overlays.js";
import { handleSourceImport } from "./source-import.js";
import { handleExtractAudio } from "./extract-audio.js";
import { handleScoreClips } from "./score-clips.js";
import { handleTranscribe } from "./transcribe.js";
import type { HandlerRegistry, JobPayload } from "./types.js";

const noop = async (_payload: JobPayload) => {
  /* Phase 1 stub */
};

export const handlers: HandlerRegistry = {
  "source.validate": noop,
  "source.import": handleSourceImport,
  "source.extract_metadata": noop,
  "media.extract_audio": handleExtractAudio,
  "media.transcribe": handleTranscribe,
  "media.detect_scenes": noop,
  "ai.score_clips": handleScoreClips,
  "ai.generate_metadata": noop,
  "render.clip": handleRenderClip,
  "render.apply_overlays": handleRenderApplyOverlays,
  "ai.suggest_overlays": handleSuggestOverlays,
  "overlay.validate_urls": noop,
  "publish.youtube": handlePublish,
  "publish.tiktok": handlePublish,
  "publish.instagram": handlePublish,
  "batch.render": handleBatchRender,
  "publish.scheduled": handlePublishScheduled,
  "analytics.rollup": handleAnalyticsRollup,
};

export const runHandler = async (name: string, payload: JobPayload) => {
  if (
    name === "publish.youtube" ||
    name === "publish.tiktok" ||
    name === "publish.instagram"
  ) {
    await handlePublish(payload, name);
    return;
  }

  const handler = handlers[name as JobTypeName];
  if (handler === undefined) {
    throw new Error(`No handler for job type: ${name}`);
  }
  await handler(payload);
};
