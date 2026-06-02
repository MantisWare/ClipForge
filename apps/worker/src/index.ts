import { loadMonorepoEnvFiles } from "@clipforge/shared/server";
import { Worker } from "bullmq";
import IORedis from "ioredis";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  markJobCompleted,
  markJobFailed,
  markJobRunning,
} from "./lib/job-repository.js";
import { runHandler } from "./handlers/index.js";
import type { JobPayload } from "./handlers/types.js";

const CLIPFORGE_QUEUE = "clipforge-jobs";

const getConnection = () => {
  const url = process.env.REDIS_URL ?? "redis://localhost:6379";
  return new IORedis(url, { maxRetriesPerRequest: null });
};

const parsePayload = (data: unknown): JobPayload => {
  if (typeof data !== "object" || data === null) {
    throw new Error("Invalid job payload");
  }
  const record = data as Record<string, unknown>;
  const jobId = record.jobId;
  const workspaceId = record.workspaceId;
  if (typeof jobId !== "string" || typeof workspaceId !== "string") {
    throw new Error("jobId and workspaceId are required in payload");
  }
  return record as JobPayload;
};

const main = () => {
  const repoRoot = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../../..",
  );
  loadMonorepoEnvFiles(repoRoot);

  const s3Endpoint = process.env.S3_ENDPOINT ?? "(not set)";
  const s3Key = process.env.S3_ACCESS_KEY ?? "(not set)";
  console.log(
    `[worker] S3_ENDPOINT=${s3Endpoint} S3_ACCESS_KEY=${s3Key} CLIPFORGE_DOCKER=${process.env.CLIPFORGE_DOCKER ?? "0"}`,
  );

  const connection = getConnection();

  const worker = new Worker(
    CLIPFORGE_QUEUE,
    async (job) => {
      const payload = parsePayload(job.data);
      const jobId = payload.jobId;

      await markJobRunning(jobId);

      try {
        await runHandler(job.name, payload);
        await markJobCompleted(jobId, { ok: true, type: job.name });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown worker error";
        await markJobFailed(jobId, message);
        throw error;
      }
    },
    { connection, concurrency: 2 },
  );

  worker.on("completed", (job) => {
    console.log(`[worker] completed ${job.name} (${job.id})`);
  });

  worker.on("failed", (job, err) => {
    console.error(`[worker] failed ${job?.name} (${job?.id}):`, err.message);
  });

  console.log(`[worker] listening on queue "${CLIPFORGE_QUEUE}"`);
};

main();
