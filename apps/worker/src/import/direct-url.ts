import { getImportConfig } from "@clipforge/shared";
import { createWriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import axios from "axios";

export const downloadDirectUrl = async (
  url: string,
  destDir: string,
  filename: string,
): Promise<string> => {
  const config = getImportConfig();

  const head = await axios.head(url, {
    maxRedirects: 5,
    validateStatus: (s) => s >= 200 && s < 400,
  });

  const contentLength = head.headers["content-length"];
  if (contentLength !== undefined) {
    const size = Number.parseInt(String(contentLength), 10);
    if (!Number.isNaN(size) && size > config.maxSourceBytes) {
      throw new Error(
        `File exceeds maximum size of ${config.maxSourceBytes} bytes`,
      );
    }
  }

  const contentType = head.headers["content-type"];
  if (
    contentType !== undefined &&
    !String(contentType).startsWith("video/") &&
    !String(contentType).includes("octet-stream")
  ) {
    throw new Error(`URL does not appear to be a video: ${contentType}`);
  }

  await mkdir(destDir, { recursive: true });
  const destPath = join(destDir, filename);

  const response = await axios.get(url, {
    responseType: "stream",
    maxRedirects: 5,
    maxContentLength: config.maxSourceBytes,
  });

  const writer = createWriteStream(destPath);
  await pipeline(response.data as Readable, writer);

  return destPath;
};
