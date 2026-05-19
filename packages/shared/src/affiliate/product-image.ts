import { PutObjectCommand } from "@aws-sdk/client-s3";
import { buildProductLinkImageStorageKey } from "../config/overlay.js";
import { getS3Bucket, getS3Client } from "../storage/s3.js";

const extensionFromContentType = (
  contentType: string,
): "png" | "jpg" | "webp" => {
  if (contentType.includes("png")) {
    return "png";
  }
  if (contentType.includes("webp")) {
    return "webp";
  }
  return "jpg";
};

export const uploadProductImageFromUrl = async (input: {
  imageUrl: string;
  workspaceId: string;
  productLinkId: string;
}): Promise<string | null> => {
  try {
    const res = await fetch(input.imageUrl, {
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      return null;
    }

    const contentType = res.headers.get("content-type") ?? "image/jpeg";
    if (!contentType.startsWith("image/")) {
      return null;
    }

    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length === 0 || buffer.length > 5 * 1024 * 1024) {
      return null;
    }

    const extension = extensionFromContentType(contentType);
    const storageKey = buildProductLinkImageStorageKey(
      input.workspaceId,
      input.productLinkId,
      extension,
    );

    const client = getS3Client();
    await client.send(
      new PutObjectCommand({
        Bucket: getS3Bucket(),
        Key: storageKey,
        Body: buffer,
        ContentType: contentType,
      }),
    );

    return storageKey;
  } catch {
    return null;
  }
};
