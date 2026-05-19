import ffmpeg from "fluent-ffmpeg";
import type { ProbeResult } from "@clipforge/shared";

export const probeVideoFile = (filePath: string): Promise<ProbeResult> =>
  new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err !== null && err !== undefined) {
        reject(err);
        return;
      }
      const videoStream = metadata.streams.find((s) => s.codec_type === "video");
      const durationRaw =
        metadata.format.duration ?? videoStream?.duration ?? undefined;
      const durationSeconds =
        durationRaw !== undefined
          ? typeof durationRaw === "string"
            ? Number.parseFloat(durationRaw)
            : durationRaw
          : undefined;
      const fpsRaw = videoStream?.r_frame_rate;
      let fps: number | undefined;
      if (fpsRaw !== undefined && fpsRaw.includes("/")) {
        const [num, den] = fpsRaw.split("/");
        const n = Number.parseFloat(num ?? "0");
        const d = Number.parseFloat(den ?? "1");
        if (d !== 0) {
          fps = n / d;
        }
      }
      resolve({
        durationSeconds:
          durationSeconds !== undefined ? durationSeconds : undefined,
        width: videoStream?.width ?? undefined,
        height: videoStream?.height ?? undefined,
        fps,
      });
    });
  });
