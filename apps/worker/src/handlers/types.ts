import type { JobTypeName } from "@clipforge/shared";

export type JobPayload = {
  jobId: string;
  workspaceId: string;
  sourceVideoId?: string;
  renderedClipId?: string;
  clipCandidateId?: string;
  publishJobId?: string;
  [key: string]: unknown;
};

export type JobHandler = (payload: JobPayload) => Promise<void>;

export type HandlerRegistry = Partial<Record<JobTypeName, JobHandler>>;
