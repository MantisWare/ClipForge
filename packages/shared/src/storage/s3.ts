import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createReadStream } from "node:fs";
import type { Readable } from "node:stream";

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
