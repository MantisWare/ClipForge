import {
  JOB_TYPE_TO_PRISMA,
  type JobTypeName,
} from "@clipforge/shared";
import { JobStatus, JobType, prisma, type Prisma } from "@clipforge/database";
import { Queue } from "bullmq";
import IORedis from "ioredis";

const CLIPFORGE_QUEUE = "clipforge-jobs";

const getRedisConnection = () => {
  const url = process.env.REDIS_URL ?? "redis://localhost:6379";
  return new IORedis(url, { maxRetriesPerRequest: null });
};

let queue: Queue | null = null;

const getQueue = (): Queue => {
  if (queue === null) {
    queue = new Queue(CLIPFORGE_QUEUE, { connection: getRedisConnection() });
  }
  return queue;
};

export const enqueueFromWorker = async (input: {
  workspaceId: string;
  type: JobTypeName;
  payload?: Record<string, unknown>;
  sourceVideoId?: string;
}) => {
  const prismaType = JOB_TYPE_TO_PRISMA[input.type] as JobType;
  const payload = input.payload ?? {};

  const jobRecord = await prisma.job.create({
    data: {
      workspaceId: input.workspaceId,
      sourceVideoId: input.sourceVideoId,
      type: prismaType,
      status: JobStatus.queued,
      payload: payload as Prisma.InputJsonValue,
    },
  });

  const bullQueue = getQueue();
  await bullQueue.add(
    input.type,
    {
      jobId: jobRecord.id,
      workspaceId: input.workspaceId,
      sourceVideoId: input.sourceVideoId,
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
    data: { bullJobId: jobRecord.id },
  });

  return jobRecord;
};
