export const JOB_TYPES = [
  "source.validate",
  "source.import",
  "source.extract_metadata",
  "media.extract_audio",
  "media.transcribe",
  "media.detect_scenes",
  "ai.score_clips",
  "ai.generate_metadata",
  "render.clip",
  "publish.youtube",
  "publish.tiktok",
  "publish.instagram",
  "batch.render",
  "publish.scheduled",
  "analytics.rollup",
  "render.apply_overlays",
  "ai.suggest_overlays",
  "ai.discover_amazon_product",
  "overlay.validate_urls",
] as const;

export type JobTypeName = (typeof JOB_TYPES)[number];

export const JOB_TYPE_TO_PRISMA: Record<
  JobTypeName,
  | "source_validate"
  | "source_import"
  | "source_extract_metadata"
  | "media_extract_audio"
  | "media_transcribe"
  | "media_detect_scenes"
  | "ai_score_clips"
  | "ai_generate_metadata"
  | "render_clip"
  | "publish_youtube"
  | "publish_tiktok"
  | "publish_instagram"
  | "batch_render"
  | "publish_scheduled"
  | "analytics_rollup"
  | "render_apply_overlays"
  | "ai_suggest_overlays"
  | "ai_discover_amazon_product"
  | "overlay_validate_urls"
> = {
  "source.validate": "source_validate",
  "source.import": "source_import",
  "source.extract_metadata": "source_extract_metadata",
  "media.extract_audio": "media_extract_audio",
  "media.transcribe": "media_transcribe",
  "media.detect_scenes": "media_detect_scenes",
  "ai.score_clips": "ai_score_clips",
  "ai.generate_metadata": "ai_generate_metadata",
  "render.clip": "render_clip",
  "publish.youtube": "publish_youtube",
  "publish.tiktok": "publish_tiktok",
  "publish.instagram": "publish_instagram",
  "batch.render": "batch_render",
  "publish.scheduled": "publish_scheduled",
  "analytics.rollup": "analytics_rollup",
  "render.apply_overlays": "render_apply_overlays",
  "ai.suggest_overlays": "ai_suggest_overlays",
  "ai.discover_amazon_product": "ai_discover_amazon_product",
  "overlay.validate_urls": "overlay_validate_urls",
};

export const PRISMA_TO_JOB_TYPE: Record<string, JobTypeName> = Object.fromEntries(
  Object.entries(JOB_TYPE_TO_PRISMA).map(([k, v]) => [v, k as JobTypeName]),
) as Record<string, JobTypeName>;
