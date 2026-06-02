import { buildSourceAudioStorageKey, getImportConfig } from "@clipforge/shared";
import {
  downloadFileFromS3,
  uploadFileToS3,
} from "@clipforge/shared/server";
import { prisma, SourceStatus } from "@clipforge/database";
import ffmpeg from "fluent-ffmpeg";
import { mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { enqueueJob } from "../lib/queue.js";

export type ExtractAudioPayload = {
  sourceVideoId: string;
  workspaceId: string;
  audioStorageKey?: string;
};

const extractAudioToWav = (
  inputPath: string,
  outputPath: string,
): Promise<void> =>
  new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .noVideo()
      .audioChannels(1)
      .audioFrequency(16000)
      .audioCodec("pcm_s16le")
      .format("wav")
      .on("end", () => resolve())
      .on("error", (err) => reject(err))
      .save(outputPath);
  });

export const runExtractAudio = async (
  payload: ExtractAudioPayload,
): Promise<string> => {
  const { sourceVideoId, workspaceId } = payload;
  const config = getImportConfig();

  const source = await prisma.sourceVideo.findUnique({
    where: { id: sourceVideoId },
  });

  if (source === null) {
    throw new Error(`Source video not found: ${sourceVideoId}`);
  }

  if (source.storageKey === null) {
    throw new Error("Source video has no storageKey — import first");
  }

  const audioStorageKey =
    payload.audioStorageKey ??
    buildSourceAudioStorageKey(workspaceId, sourceVideoId);

  await prisma.sourceVideo.update({
    where: { id: sourceVideoId },
    data: { status: SourceStatus.transcribing },
  });

  const workDir = join(config.tempDir, sourceVideoId, "audio");
  await mkdir(workDir, { recursive: true });

  const videoPath = join(workDir, "source.mp4");
  const wavPath = join(workDir, "audio.wav");

  try {
    await downloadFileFromS3(
      source.storageKey,
      videoPath,
      config.maxSourceBytes,
    );
    await extractAudioToWav(videoPath, wavPath);
    await uploadFileToS3(audioStorageKey, wavPath, "audio/wav");

    await enqueueJob({
      workspaceId,
      type: "media.transcribe",
      sourceVideoId,
      payload: {
        sourceVideoId,
        workspaceId,
        audioStorageKey,
      },
    });

    return audioStorageKey;
  } catch (error) {
    await prisma.sourceVideo.update({
      where: { id: sourceVideoId },
      data: { status: SourceStatus.failed },
    });
    throw error;
  } finally {
    await rm(workDir, { recursive: true, force: true }).catch(() => undefined);
  }
};
