export type TranscribeConfig = {
  workerAiUrl: string;
  whisperModel: string;
  whisperDevice: string;
  autoTranscribe: boolean;
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

export const getTranscribeConfig = (): TranscribeConfig => ({
  workerAiUrl: process.env.WORKER_AI_URL ?? "http://localhost:8002",
  whisperModel: process.env.WHISPER_MODEL ?? "base",
  whisperDevice: process.env.WHISPER_DEVICE ?? "cpu",
  autoTranscribe: parseBool(process.env.AUTO_TRANSCRIBE, true),
});

export const buildSourceAudioStorageKey = (
  workspaceId: string,
  sourceVideoId: string,
  filename = "audio.wav",
): string =>
  ["workspaces", workspaceId, "sources", sourceVideoId, filename].join("/");
