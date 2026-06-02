import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createWriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import { createReadStream } from "node:fs";
import { dirname } from "node:path";
import { pipeline } from "node:stream/promises";
import type { Readable } from "node:stream";

export const getS3Client = () => {
  const endpoint = process.env.S3_ENDPOINT?.trim();
  const region = process.env.S3_REGION ?? "us-east-1";
  const accessKeyId = process.env.S3_ACCESS_KEY ?? "clipforge";
  const secretAccessKey = process.env.S3_SECRET_KEY ?? "clipforge_secret";

  if (endpoint === undefined || endpoint === "") {
    throw new Error(
      "S3_ENDPOINT is not set. For ./start-docker.sh use http://localhost:9002 (see infra/docker.env).",
    );
  }

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

export const getS3Bucket = () => process.env.S3_BUCKET ?? "clipforge-media";

export const getSignedDownloadUrl = async (
  key: string,
  expiresIn = 3600,
): Promise<string> => {
  const client = getS3Client();
  const command = new GetObjectCommand({
    Bucket: getS3Bucket(),
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
    Bucket: getS3Bucket(),
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(client, command, { expiresIn });
};

export const uploadFileToS3 = async (
  key: string,
  filePath: string,
  contentType = "video/mp4",
): Promise<void> => {
  const client = getS3Client();
  const body = createReadStream(filePath);
  await client.send(
    new PutObjectCommand({
      Bucket: getS3Bucket(),
      Key: key,
      Body: body as unknown as Readable,
      ContentType: contentType,
    }),
  );
};

/** Download an object via the S3 API (avoids presigned-URL HEAD/GET mismatches). */
export const downloadFileFromS3 = async (
  key: string,
  destPath: string,
  maxBytes?: number,
): Promise<void> => {
  const client = getS3Client();
  const response = await client.send(
    new GetObjectCommand({
      Bucket: getS3Bucket(),
      Key: key,
    }),
  );

  if (response.Body === undefined) {
    throw new Error(`S3 object not found or empty: ${key}`);
  }

  const contentLength = response.ContentLength;
  if (
    contentLength !== undefined &&
    maxBytes !== undefined &&
    contentLength > maxBytes
  ) {
    throw new Error(
      `File exceeds maximum size of ${maxBytes} bytes (${contentLength} bytes)`,
    );
  }

  await mkdir(dirname(destPath), { recursive: true });
  const writer = createWriteStream(destPath);
  await pipeline(response.Body as Readable, writer);
};
