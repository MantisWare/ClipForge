import {
  buildSourceStorageKey,
  getImportConfig,
  getTranscribeConfig,
} from "@clipforge/shared";
import {
  downloadFileFromS3,
  uploadFileToS3,
} from "@clipforge/shared/server";
import { enqueueJob } from "../lib/queue.js";
import { prisma, SourceStatus } from "@clipforge/database";
import { mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { downloadDirectUrl } from "./direct-url.js";
import { probeVideoFile } from "./ffprobe.js";
import { downloadYouTubeVideo } from "./youtube.js";

export type ImportPayload = {
  sourceVideoId: string;
  workspaceId: string;
  skipDownload?: boolean;
  storageKey?: string;
};

export const runSourceImport = async (payload: ImportPayload): Promise<void> => {
  const { sourceVideoId, workspaceId } = payload;
  const config = getImportConfig();

  const source = await prisma.sourceVideo.findUnique({
    where: { id: sourceVideoId },
  });

  if (source === null) {
    throw new Error(`Source video not found: ${sourceVideoId}`);
  }

  await prisma.sourceVideo.update({
    where: { id: sourceVideoId },
    data: { status: SourceStatus.importing },
  });

  const workDir = join(config.tempDir, sourceVideoId);
  await mkdir(workDir, { recursive: true });

  let localPath: string | undefined;
  let storageKey =
    payload.storageKey ??
    source.storageKey ??
    buildSourceStorageKey(workspaceId, sourceVideoId, "source.mp4");

  try {
    if (payload.skipDownload === true && source.storageKey !== null) {
      storageKey = source.storageKey ?? storageKey;
      localPath = join(workDir, "probe.mp4");
      await downloadFileFromS3(storageKey, localPath, config.maxSourceBytes);
    } else if (source.sourceType === "youtube") {
      localPath = await downloadYouTubeVideo(source.sourceUrl, workDir);
    } else if (
      source.sourceType === "direct_url" ||
      source.sourceType === "vimeo"
    ) {
      localPath = await downloadDirectUrl(
        source.sourceUrl,
        workDir,
        "source.mp4",
      );
    } else if (source.sourceType === "upload") {
      if (source.storageKey === null) {
        throw new Error("Upload source missing storageKey");
      }
      storageKey = source.storageKey;
      localPath = join(workDir, "source.mp4");
      await downloadFileFromS3(storageKey, localPath, config.maxSourceBytes);
    } else {
      throw new Error(`Unsupported source type: ${source.sourceType}`);
    }

    if (payload.skipDownload !== true) {
      await uploadFileToS3(storageKey, localPath, "video/mp4");
    }

    const probe = await probeVideoFile(localPath);

    await prisma.sourceVideo.update({
      where: { id: sourceVideoId },
      data: {
        storageKey,
        status: SourceStatus.imported,
        durationSeconds: probe.durationSeconds ?? source.durationSeconds,
        width: probe.width ?? source.width,
        height: probe.height ?? source.height,
        fps: probe.fps ?? source.fps,
      },
    });

    const transcribeConfig = getTranscribeConfig();
    if (transcribeConfig.autoTranscribe) {
      await enqueueJob({
        workspaceId,
        type: "media.extract_audio",
        sourceVideoId,
        payload: { sourceVideoId, workspaceId },
      });
    }
  } catch (error) {
    await prisma.sourceVideo.update({
      where: { id: sourceVideoId },
      data: {
        status: SourceStatus.failed,
      },
    });
    throw error;
  } finally {
    await rm(workDir, { recursive: true, force: true }).catch(() => undefined);
  }
};
