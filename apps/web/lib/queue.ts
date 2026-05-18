import {
  JOB_TYPE_TO_PRISMA,
  type JobTypeName,
} from "@clipforge/shared";
import { JobStatus, JobType, prisma, type Prisma } from "@clipforge/database";
import { Queue } from "bullmq";
import IORedis from "ioredis";

const getRedisConnection = () => {
  const url = process.env.REDIS_URL ?? "redis://localhost:6379";
  return new IORedis(url, { maxRetriesPerRequest: null });
};

const queueCache = new Map<string, Queue>();

export const getQueue = (name: string): Queue => {
  const existing = queueCache.get(name);
  if (existing !== undefined) {
    return existing;
  }
  const queue = new Queue(name, { connection: getRedisConnection() });
  queueCache.set(name, queue);
  return queue;
};

export const CLIPFORGE_QUEUE = "clipforge-jobs";

export type EnqueueJobInput = {
  workspaceId: string;
  type: JobTypeName;
  payload?: Record<string, unknown>;
  sourceVideoId?: string;
};

export const enqueueJob = async ({
  workspaceId,
  type,
  payload = {},
  sourceVideoId,
}: EnqueueJobInput) => {
  const prismaType = JOB_TYPE_TO_PRISMA[type] as JobType;

  const jobRecord = await prisma.job.create({
    data: {
      workspaceId,
      sourceVideoId,
      type: prismaType,
      status: JobStatus.queued,
      payload: payload as Prisma.InputJsonValue,
    },
  });

  try {
    const queue = getQueue(CLIPFORGE_QUEUE);
    const bullJob = await queue.add(
      type,
      {
        jobId: jobRecord.id,
        workspaceId,
        sourceVideoId,
        ...payload,
      },
      {
        jobId: jobRecord.id,
        attempts: 3,
        backoff: { type: "exponential", delay: 5000 },
      },
    );

    await prisma.job.update({
      where: { id: jobRecord.id },
      data: { bullJobId: bullJob.id },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Queue unavailable";
    await prisma.job.update({
      where: { id: jobRecord.id },
      data: {
        status: JobStatus.queued,
        errorMessage: `BullMQ enqueue deferred: ${message}`,
      },
    });
  }

  return jobRecord;
};
