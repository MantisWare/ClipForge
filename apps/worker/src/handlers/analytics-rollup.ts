import { prisma } from "@clipforge/database";
import {
  ClipStatus,
  PublishJobStatus,
  RenderStatus,
} from "@clipforge/database";
import type { JobPayload } from "./types.js";

export const handleAnalyticsRollup = async (payload: JobPayload) => {
  const workspaceId =
    typeof payload.workspaceId === "string" ? payload.workspaceId : undefined;

  const date = new Date();
  date.setHours(0, 0, 0, 0);

  const workspaces =
    workspaceId !== undefined
      ? [{ id: workspaceId }]
      : await prisma.workspace.findMany({ select: { id: true } });

  for (const ws of workspaces) {
    const dayStart = date;
    const dayEnd = new Date(date);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const [
      sourcesImported,
      clipsGenerated,
      clipsApproved,
      clipsRendered,
      publishAttempts,
      publishSuccess,
    ] = await Promise.all([
      prisma.sourceVideo.count({
        where: {
          workspaceId: ws.id,
          createdAt: { gte: dayStart, lt: dayEnd },
        },
      }),
      prisma.clipCandidate.count({
        where: {
          sourceVideo: { workspaceId: ws.id },
          createdAt: { gte: dayStart, lt: dayEnd },
        },
      }),
      prisma.clipCandidate.count({
        where: {
          sourceVideo: { workspaceId: ws.id },
          status: ClipStatus.approved,
          updatedAt: { gte: dayStart, lt: dayEnd },
        },
      }),
      prisma.renderedClip.count({
        where: {
          workspaceId: ws.id,
          status: RenderStatus.ready,
          updatedAt: { gte: dayStart, lt: dayEnd },
        },
      }),
      prisma.publishJob.count({
        where: {
          workspaceId: ws.id,
          createdAt: { gte: dayStart, lt: dayEnd },
        },
      }),
      prisma.publishJob.count({
        where: {
          workspaceId: ws.id,
          status: PublishJobStatus.published,
          updatedAt: { gte: dayStart, lt: dayEnd },
        },
      }),
    ]);

    await prisma.workspaceDailyStats.upsert({
      where: {
        workspaceId_date: { workspaceId: ws.id, date: dayStart },
      },
      create: {
        workspaceId: ws.id,
        date: dayStart,
        sourcesImported,
        clipsGenerated,
        clipsApproved,
        clipsRendered,
        publishAttempts,
        publishSuccess,
      },
      update: {
        sourcesImported,
        clipsGenerated,
        clipsApproved,
        clipsRendered,
        publishAttempts,
        publishSuccess,
      },
    });
  }
};
