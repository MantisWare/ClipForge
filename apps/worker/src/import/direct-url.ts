import { getImportConfig } from "@clipforge/shared";
import { createWriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import axios from "axios";

/** Presigned GetObject URLs reject HEAD with 403; only GET is signed. */
const isPresignedS3Url = (url: string): boolean =>
  url.includes("X-Amz-Algorithm=") || url.includes("X-Amz-Signature=");

const validateContentLength = (
  contentLength: string | number | undefined,
  maxBytes: number,
): void => {
  if (contentLength === undefined) {
    return;
  }
  const size = Number.parseInt(String(contentLength), 10);
  if (!Number.isNaN(size) && size > maxBytes) {
    throw new Error(`File exceeds maximum size of ${maxBytes} bytes`);
  }
};

const validateVideoContentType = (contentType: string | undefined): void => {
  if (contentType === undefined) {
    return;
  }
  const value = String(contentType);
  if (
    !value.startsWith("video/") &&
    !value.includes("octet-stream") &&
    !value.startsWith("audio/")
  ) {
    throw new Error(`URL does not appear to be media: ${contentType}`);
  }
};

export const downloadDirectUrl = async (
  url: string,
  destDir: string,
  filename: string,
): Promise<string> => {
  const config = getImportConfig();
  const skipHead = isPresignedS3Url(url);

  if (!skipHead) {
    const head = await axios.head(url, {
      maxRedirects: 5,
      validateStatus: (s) => s >= 200 && s < 400,
    });
    validateContentLength(head.headers["content-length"], config.maxSourceBytes);
    validateVideoContentType(head.headers["content-type"]);
  }

  await mkdir(destDir, { recursive: true });
  const destPath = join(destDir, filename);

  const response = await axios.get(url, {
    responseType: "stream",
    maxRedirects: 5,
    maxContentLength: config.maxSourceBytes,
  });

  validateContentLength(response.headers["content-length"], config.maxSourceBytes);
  if (skipHead) {
    validateVideoContentType(response.headers["content-type"]);
  }

  const writer = createWriteStream(destPath);
  await pipeline(response.data as Readable, writer);

  return destPath;
};
