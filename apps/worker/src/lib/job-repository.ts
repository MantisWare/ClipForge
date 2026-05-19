import {
  JobStatus,
  prisma,
  type Prisma,
} from "@clipforge/database";

export const markJobRunning = async (jobId: string) => {
  await prisma.job.update({
    where: { id: jobId },
    data: {
      status: JobStatus.running,
      startedAt: new Date(),
      errorMessage: null,
    },
  });
};

export const markJobCompleted = async (
  jobId: string,
  result?: Prisma.InputJsonValue,
) => {
  await prisma.job.update({
    where: { id: jobId },
    data: {
      status: JobStatus.completed,
      completedAt: new Date(),
      result: result ?? {},
    },
  });
};

export const markJobFailed = async (jobId: string, errorMessage: string) => {
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  await prisma.job.update({
    where: { id: jobId },
    data: {
      status: JobStatus.failed,
      completedAt: new Date(),
      errorMessage,
      attempts: (job?.attempts ?? 0) + 1,
    },
  });
};

export const sleep = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
