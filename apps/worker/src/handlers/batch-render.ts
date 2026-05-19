import { getBatchConfig } from "@clipforge/shared";
import { prisma, RenderStatus } from "@clipforge/database";
import { runRenderClip } from "../render/run-render-clip.js";
import type { JobPayload } from "./types.js";

type BatchItem = {
  renderedClipId: string;
  clipCandidateId: string;
};

export const handleBatchRender = async (payload: JobPayload) => {
  const workspaceId =
    typeof payload.workspaceId === "string" ? payload.workspaceId : "";
  const items = payload.items;

  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("batch.render requires items array");
  }

  const batchConfig = getBatchConfig();
  const parsedItems: BatchItem[] = [];

  for (const item of items) {
    if (
      typeof item === "object" &&
      item !== null &&
      typeof (item as BatchItem).renderedClipId === "string" &&
      typeof (item as BatchItem).clipCandidateId === "string"
    ) {
      parsedItems.push(item as BatchItem);
    }
  }

  for (let i = 0; i < parsedItems.length; i += batchConfig.renderConcurrency) {
    const chunk = parsedItems.slice(i, i + batchConfig.renderConcurrency);
    await Promise.all(
      chunk.map(async (item) => {
        const rendered = await prisma.renderedClip.findUnique({
          where: { id: item.renderedClipId },
        });
        if (rendered === null || rendered.status === RenderStatus.ready) {
          return;
        }
        await runRenderClip({
          renderedClipId: item.renderedClipId,
          clipCandidateId: item.clipCandidateId,
          workspaceId,
        });
      }),
    );
  }
};
