import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const getS3Client = () => {
  const endpoint = process.env.S3_ENDPOINT;
  const region = process.env.S3_REGION ?? "us-east-1";
  const accessKeyId = process.env.S3_ACCESS_KEY ?? "clipforge";
  const secretAccessKey = process.env.S3_SECRET_KEY ?? "clipforge_secret";

  return new S3Client({
    region,
    endpoint,
    forcePathStyle: true,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
};

const getBucket = () => process.env.S3_BUCKET ?? "clipforge-media";

export const buildStorageKey = (
  workspaceId: string,
  ...parts: string[]
): string => ["workspaces", workspaceId, ...parts].join("/");

export const getSignedDownloadUrl = async (
  key: string,
  expiresIn = 3600,
): Promise<string> => {
  const client = getS3Client();
  const command = new GetObjectCommand({
    Bucket: getBucket(),
    Key: key,
  });
  return getSignedUrl(client, command, { expiresIn });
};

export const getSignedUploadUrl = async (
  key: string,
  contentType: string,
  expiresIn = 3600,
): Promise<string> => {
  const client = getS3Client();
  const command = new PutObjectCommand({
    Bucket: getBucket(),
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(client, command, { expiresIn });
};

export const getPublicObjectUrl = (key: string): string => {
  const base = process.env.S3_PUBLIC_URL ?? process.env.S3_ENDPOINT ?? "";
  const bucket = getBucket();
  return `${base}/${bucket}/${key}`;
};
