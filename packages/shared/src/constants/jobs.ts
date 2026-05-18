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
};

export const PRISMA_TO_JOB_TYPE: Record<string, JobTypeName> = Object.fromEntries(
  Object.entries(JOB_TYPE_TO_PRISMA).map(([k, v]) => [v, k as JobTypeName]),
) as Record<string, JobTypeName>;
