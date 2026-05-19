import {
  aiProductDiscoveryResultSchema,
  getClipScoringConfig,
  getTranscribeConfig,
  scoreClipsResponseSchema,
  type AiProductDiscoveryResult,
  type ClipWindow,
  type ScoreClipsResponse,
  type TranscribeApiResponse,
} from "@clipforge/shared";

export const transcribeAudio = async (
  signedUrl: string,
  storageKey: string,
): Promise<TranscribeApiResponse> => {
  const config = getTranscribeConfig();
  const url = `${config.workerAiUrl.replace(/\/$/, "")}/v1/transcribe`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 600_000);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        signedUrl,
        storageKey,
        model: config.whisperModel,
        device: config.whisperDevice,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`worker-ai transcribe failed: ${res.status} ${text}`);
    }

    return (await res.json()) as TranscribeApiResponse;
  } finally {
    clearTimeout(timeout);
  }
};

export const scoreClipsWithAi = async (
  windows: ClipWindow[],
): Promise<ScoreClipsResponse> => {
  const transcribeConfig = getTranscribeConfig();
  const clipConfig = getClipScoringConfig();
  const url = `${transcribeConfig.workerAiUrl.replace(/\/$/, "")}/v1/score-clips`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 300_000);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        windows,
        model: clipConfig.openaiModel,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`worker-ai score-clips failed: ${res.status} ${text}`);
    }

    const json: unknown = await res.json();
    const parsed = scoreClipsResponseSchema.safeParse(json);
    if (!parsed.success) {
      throw new Error(`Invalid score-clips response: ${parsed.error.message}`);
    }
    return parsed.data;
  } finally {
    clearTimeout(timeout);
  }
};

export type DiscoverAmazonProductInput = {
  suggestedTitle?: string | null;
  suggestedHook?: string | null;
  suggestedCaption?: string | null;
  suggestedHashtags?: string[];
  transcriptExcerpt: string;
  transcriptSegments: Array<{ startMs: number; endMs: number; text: string }>;
};

export const discoverAmazonProductWithAi = async (
  input: DiscoverAmazonProductInput,
): Promise<AiProductDiscoveryResult> => {
  const transcribeConfig = getTranscribeConfig();
  const clipConfig = getClipScoringConfig();
  const url = `${transcribeConfig.workerAiUrl.replace(/\/$/, "")}/v1/discover-amazon-product`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120_000);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...input,
        model: clipConfig.openaiModel,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(
        `worker-ai discover-amazon-product failed: ${res.status} ${text}`,
      );
    }

    const json: unknown = await res.json();
    const parsed = aiProductDiscoveryResultSchema.safeParse(json);
    if (!parsed.success) {
      throw new Error(
        `Invalid discover-amazon-product response: ${parsed.error.message}`,
      );
    }
    return parsed.data;
  } finally {
    clearTimeout(timeout);
  }
};
