import {
  buildSourceAudioStorageKey,
  getClipScoringConfig,
  getSignedDownloadUrl,
} from "@clipforge/shared";
import { prisma, SourceStatus } from "@clipforge/database";
import { enqueueJob } from "../lib/queue.js";
import { transcribeAudio } from "../lib/worker-ai-client.js";

export type TranscribePayload = {
  sourceVideoId: string;
  workspaceId: string;
  audioStorageKey?: string;
};

export const runTranscribe = async (payload: TranscribePayload): Promise<void> => {
  const { sourceVideoId, workspaceId } = payload;

  const source = await prisma.sourceVideo.findUnique({
    where: { id: sourceVideoId },
  });

  if (source === null) {
    throw new Error(`Source video not found: ${sourceVideoId}`);
  }

  const audioStorageKey =
    payload.audioStorageKey ??
    buildSourceAudioStorageKey(workspaceId, sourceVideoId);

  await prisma.sourceVideo.update({
    where: { id: sourceVideoId },
    data: { status: SourceStatus.transcribing },
  });

  try {
    const signedUrl = await getSignedDownloadUrl(audioStorageKey, 3600);
    const result = await transcribeAudio(signedUrl, audioStorageKey);

    await prisma.$transaction(async (tx) => {
      await tx.transcriptSegment.deleteMany({
        where: { sourceVideoId },
      });

      for (const segment of result.segments) {
        const created = await tx.transcriptSegment.create({
          data: {
            sourceVideoId,
            startMs: segment.startMs,
            endMs: segment.endMs,
            text: segment.text,
            confidence: segment.confidence ?? null,
            speakerLabel: segment.speakerLabel ?? null,
          },
        });

        if (segment.words !== undefined && segment.words.length > 0) {
          await tx.transcriptWord.createMany({
            data: segment.words.map((w) => ({
              segmentId: created.id,
              word: w.word,
              startMs: w.startMs,
              endMs: w.endMs,
              confidence: w.confidence ?? null,
            })),
          });
        }
      }

      await tx.sourceVideo.update({
        where: { id: sourceVideoId },
        data: {
          status: SourceStatus.ready,
          language: result.language,
        },
      });
    });

    const clipConfig = getClipScoringConfig();
    if (clipConfig.autoGenerateClips) {
      await enqueueJob({
        workspaceId,
        type: "ai.score_clips",
        sourceVideoId,
        payload: {
          sourceVideoId,
          workspaceId,
          clipCount: clipConfig.defaultClipCount,
        },
      });
    }
  } catch (error) {
    await prisma.sourceVideo.update({
      where: { id: sourceVideoId },
      data: { status: SourceStatus.failed },
    });
    throw error;
  }
};
