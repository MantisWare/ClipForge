import { prisma, PublishJobStatus } from "@clipforge/database";
import { ensureGoogleAccessToken } from "./google-token.js";
import { readFile } from "node:fs/promises";
import { downloadFileFromS3 } from "@clipforge/shared/server";
import { mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { getImportConfig } from "@clipforge/shared";
export const publishToYouTube = async (publishJobId: string): Promise<void> => {
  const job = await prisma.publishJob.findUnique({
    where: { id: publishJobId },
    include: {
      renderedClip: true,
      connectedAccount: true,
    },
  });

  if (job === null) {
    throw new Error(`Publish job not found: ${publishJobId}`);
  }

  if (job.connectedAccount === null) {
    throw new Error("YouTube publish requires a connected account");
  }

  if (job.renderedClip.storageKey === null) {
    throw new Error("Rendered clip has no storage key");
  }

  const accessToken = await ensureGoogleAccessToken(job.connectedAccount);

  const config = getImportConfig();
  const workDir = join(config.tempDir, "publish", publishJobId);
  await mkdir(workDir, { recursive: true });
  const filePath = join(workDir, "upload.mp4");

  try {
    await downloadFileFromS3(
      job.renderedClip.storageKey,
      filePath,
      config.maxSourceBytes,
    );
    const fileBuffer = await readFile(filePath);

    const captionBody = job.caption?.trim() ?? "";
    const extraHashtags =
      captionBody.includes("#") || (job.hashtags?.length ?? 0) === 0
        ? ""
        : `\n\n${(job.hashtags ?? [])
            .map((h) => (h.startsWith("#") ? h : `#${h}`))
            .join(" ")}`;

    const metadata = {
      snippet: {
        title: job.title ?? "ClipForge Short",
        description: `${captionBody}${extraHashtags}`.trim(),
        categoryId: "22",
      },
      status: {
        privacyStatus:
          job.visibility === "private"
            ? "private"
            : job.visibility === "unlisted"
              ? "unlisted"
              : "public",
        selfDeclaredMadeForKids: false,
      },
    };

    const initRes = await fetch(
      "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "X-Upload-Content-Type": "video/mp4",
          "X-Upload-Content-Length": String(fileBuffer.length),
        },
        body: JSON.stringify(metadata),
      },
    );

    if (!initRes.ok) {
      const text = await initRes.text();
      throw new Error(`YouTube upload init failed: ${initRes.status} ${text}`);
    }

    const uploadUrl = initRes.headers.get("location");
    if (uploadUrl === null) {
      throw new Error("YouTube upload missing location header");
    }

    const uploadRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": "video/mp4",
        "Content-Length": String(fileBuffer.length),
      },
      body: fileBuffer,
    });

    if (!uploadRes.ok) {
      const text = await uploadRes.text();
      throw new Error(`YouTube upload failed: ${uploadRes.status} ${text}`);
    }

    const result = (await uploadRes.json()) as { id?: string };
    const videoId = result.id;

    await prisma.publishJob.update({
      where: { id: publishJobId },
      data: {
        status: PublishJobStatus.published,
        externalPostId: videoId ?? null,
        externalUrl:
          videoId !== undefined
            ? `https://www.youtube.com/watch?v=${videoId}`
            : null,
        errorMessage: null,
      },
    });
  } finally {
    await rm(workDir, { recursive: true, force: true }).catch(() => undefined);
  }
};
