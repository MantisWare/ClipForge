import type { OverlayRenderItem } from "@clipforge/shared";
import { getRenderConfig, overlayPositionToFfmpeg } from "@clipforge/shared";
import ffmpeg from "fluent-ffmpeg";

const escapeDrawtext = (text: string): string =>
  text
    .replace(/\\/g, "\\\\")
    .replace(/:/g, "\\:")
    .replace(/'/g, "'\\''")
    .replace(/%/g, "\\%");

const escapeMoviePath = (path: string): string =>
  path.replace(/\\/g, "/").replace(/:/g, "\\:").replace(/'/g, "'\\''");

const msToSec = (ms: number, clipStartMs: number): number =>
  Math.max(0, (ms - clipStartMs) / 1000);

export type ImageOverlaySpec = {
  localPath: string;
  xExpr: string;
  yExpr: string;
  startSec: number;
  endSec: number;
};

export const buildOverlayDrawtextFilters = (
  overlays: OverlayRenderItem[],
  clipStartMs: number,
  hookFontSize: number,
  hookColor: string,
): { drawtextFilters: string[]; imageOverlays: ImageOverlaySpec[] } => {
  const config = getRenderConfig();
  const drawtextFilters: string[] = [];
  const imageOverlays: ImageOverlaySpec[] = [];

  for (const overlay of overlays) {
    const start = msToSec(overlay.startMs, clipStartMs);
    const end = msToSec(overlay.endMs, clipStartMs);
    const enable = `enable='between(t,${start},${end})'`;
    const pos = overlayPositionToFfmpeg(overlay.position);

    switch (overlay.type) {
      case "end_slate": {
        const headline = escapeDrawtext(
          overlay.assets.headline ?? overlay.assets.title ?? "Follow for more",
        );
        const cta = escapeDrawtext(overlay.assets.cta ?? "Link in bio");
        const headlineY = `(${pos.yExpr})`;
        drawtextFilters.push(
          `drawtext=text='${headline}':fontsize=${hookFontSize}:fontcolor=${hookColor}:borderw=2:bordercolor=black:x=${pos.xExpr}:y=${headlineY}:${enable}`,
        );
        drawtextFilters.push(
          `drawtext=text='${cta}':fontsize=${Math.floor(hookFontSize * 0.7)}:fontcolor=${hookColor}:borderw=2:bordercolor=black:x=${pos.xExpr}:y=h-120:${enable}`,
        );
        break;
      }
      case "affiliate_bar": {
        const disclosure = escapeDrawtext(
          overlay.assets.disclosure ?? "Links may earn a commission.",
        );
        drawtextFilters.push(
          `drawtext=text='${disclosure}':fontsize=28:fontcolor=white:box=1:boxcolor=black@0.6:boxborderw=8:x=${pos.xExpr}:y=${pos.yExpr}:${enable}`,
        );
        break;
      }
      case "product_pin": {
        if (overlay.assets.imagePath !== undefined) {
          imageOverlays.push({
            localPath: overlay.assets.imagePath,
            xExpr: pos.xExpr,
            yExpr: pos.yExpr,
            startSec: start,
            endSec: end,
          });
        }
        const title = escapeDrawtext(overlay.assets.title ?? "Product");
        const cta = escapeDrawtext(overlay.assets.cta ?? "Shop");
        drawtextFilters.push(
          `drawtext=text='${title}':fontsize=32:fontcolor=white:box=1:boxcolor=black@0.7:boxborderw=10:x=${pos.xExpr}:y=${pos.yExpr}:${enable}`,
        );
        drawtextFilters.push(
          `drawtext=text='${cta}':fontsize=24:fontcolor=${hookColor}:borderw=2:bordercolor=black:x=${pos.xExpr}:y=h-80:${enable}`,
        );
        break;
      }
      case "sponsor_segment": {
        const label = escapeDrawtext(
          overlay.assets.disclosure ?? "Paid partnership",
        );
        drawtextFilters.push(
          `drawtext=text='${label}':fontsize=26:fontcolor=white:box=1:boxcolor=black@0.5:boxborderw=6:x=${pos.xExpr}:y=${pos.yExpr}:${enable}`,
        );
        break;
      }
      case "promo_code": {
        const code = escapeDrawtext(overlay.assets.promoCode ?? "SAVE10");
        drawtextFilters.push(
          `drawtext=text='${code}':fontsize=48:fontcolor=${hookColor}:borderw=3:bordercolor=black:x=${pos.xExpr}:y=${pos.yExpr}:${enable}`,
        );
        break;
      }
      case "qr_card": {
        const label = escapeDrawtext(overlay.assets.cta ?? "Scan to shop");
        drawtextFilters.push(
          `drawtext=text='${label}':fontsize=30:fontcolor=white:borderw=2:bordercolor=black:x=${pos.xExpr}:y=${pos.yExpr}:${enable}`,
        );
        break;
      }
      case "image": {
        if (overlay.assets.imagePath !== undefined) {
          imageOverlays.push({
            localPath: overlay.assets.imagePath,
            xExpr: pos.xExpr,
            yExpr: pos.yExpr,
            startSec: start,
            endSec: end,
          });
        }
        const label = escapeDrawtext(overlay.assets.title ?? "");
        if (label !== "") {
          drawtextFilters.push(
            `drawtext=text='${label}':fontsize=28:fontcolor=white:x=${pos.xExpr}:y=${pos.yExpr}:${enable}`,
          );
        }
        break;
      }
      default:
        break;
    }
  }

  return { drawtextFilters, imageOverlays };
};

export const runOverlayFfmpeg = (
  inputPath: string,
  outputPath: string,
  drawtextFilters: string[],
  imageOverlays: ImageOverlaySpec[] = [],
): Promise<void> => {
  const config = getRenderConfig();
  const baseScale = `scale=${config.outputWidth}:${config.outputHeight}:force_original_aspect_ratio=increase`;
  const baseCrop = `crop=${config.outputWidth}:${config.outputHeight}`;

  if (imageOverlays.length === 0) {
    const baseFilters = [baseScale, baseCrop, ...drawtextFilters];
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .videoFilters(baseFilters)
        .videoCodec("libx264")
        .audioCodec("aac")
        .outputOptions(["-pix_fmt yuv420p", "-movflags +faststart"])
        .on("end", () => resolve())
        .on("error", (err) => reject(err))
        .save(outputPath);
    });
  }

  const filters: string[] = [`[0:v]${baseScale},${baseCrop}[v0]`];
  let lastLabel = "v0";

  for (const filter of drawtextFilters) {
    const next = `v${filters.length}`;
    filters.push(`[${lastLabel}]${filter}[${next}]`);
    lastLabel = next;
  }

  for (const [index, img] of imageOverlays.entries()) {
    const imgLabel = `img${index}`;
    const outLabel = `vimg${index}`;
    const path = escapeMoviePath(img.localPath);
    const enable = `enable='between(t,${img.startSec},${img.endSec})'`;
    filters.push(
      `movie=filename='${path}':loop=0,setpts=N/(FRAME_RATE*TB),scale=240:-1[${imgLabel}]`,
    );
    filters.push(
      `[${lastLabel}][${imgLabel}]overlay=x=${img.xExpr}:y=${img.yExpr}:${enable}[${outLabel}]`,
    );
    lastLabel = outLabel;
  }

  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .complexFilter(filters)
      .outputOptions(["-map", `[${lastLabel}]`, "-map", "0:a?"])
      .videoCodec("libx264")
      .audioCodec("aac")
      .outputOptions(["-pix_fmt yuv420p", "-movflags +faststart"])
      .on("end", () => resolve())
      .on("error", (err) => reject(err))
      .save(outputPath);
  });
};
