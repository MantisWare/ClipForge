import {
  buildSourceStorageKey,
  getSignedDownloadUrl,
  getSignedUploadUrl,
} from "@clipforge/shared";

export { buildSourceStorageKey, getSignedDownloadUrl, getSignedUploadUrl };

export const buildStorageKey = (
  workspaceId: string,
  ...parts: string[]
): string => ["workspaces", workspaceId, ...parts].join("/");

export const getPublicObjectUrl = (key: string): string => {
  const base = process.env.S3_PUBLIC_URL ?? process.env.S3_ENDPOINT ?? "";
  const bucket = process.env.S3_BUCKET ?? "clipforge-media";
  return `${base}/${bucket}/${key}`;
};
