import { getRenderConfig } from "../config/render.js";

export type OverlayRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type CaptionBand = {
  top: number;
  bottom: number;
  left: number;
  right: number;
};

export const getOverlaySafeAreas = () => {
  const config = getRenderConfig();
  return {
    top: config.safeMarginTop,
    bottom: config.safeMarginBottom,
    left: config.safeMarginSides,
    right: config.safeMarginSides,
    frameWidth: config.outputWidth,
    frameHeight: config.outputHeight,
  };
};

export const getCaptionBand = (): CaptionBand => {
  const areas = getOverlaySafeAreas();
  return {
    top: areas.frameHeight - areas.bottom,
    bottom: areas.frameHeight,
    left: areas.left,
    right: areas.frameWidth - areas.right,
  };
};

export const rectsOverlap = (a: OverlayRect, b: OverlayRect): boolean =>
  a.x < b.x + b.width &&
  a.x + a.width > b.x &&
  a.y < b.y + b.height &&
  a.y + a.height > b.y;

export const anchorToRect = (
  anchor: string,
  marginPx: number,
  width: number,
  height: number,
  frameWidth: number,
  frameHeight: number,
): OverlayRect => {
  switch (anchor) {
    case "top_left":
      return { x: marginPx, y: marginPx, width, height };
    case "top_right":
      return { x: frameWidth - marginPx - width, y: marginPx, width, height };
    case "bottom_left":
      return {
        x: marginPx,
        y: frameHeight - marginPx - height,
        width,
        height,
      };
    case "center":
      return {
        x: (frameWidth - width) / 2,
        y: (frameHeight - height) / 2,
        width,
        height,
      };
    case "bottom_center":
      return {
        x: (frameWidth - width) / 2,
        y: frameHeight - marginPx - height,
        width,
        height,
      };
    case "bottom_right":
    default:
      return {
        x: frameWidth - marginPx - width,
        y: frameHeight - marginPx - height,
        width,
        height,
      };
  }
};

export const captionBandToRect = (band: CaptionBand = getCaptionBand()): OverlayRect => ({
  x: band.left,
  y: band.top,
  width: band.right - band.left,
  height: band.bottom - band.top,
});

export const detectCaptionOverlap = (
  overlayRect: OverlayRect,
  captionBand: CaptionBand = getCaptionBand(),
): boolean => rectsOverlap(overlayRect, captionBandToRect(captionBand));

export const scoreOverlayDensity = (
  overlays: Array<{ startMs: number; endMs: number; position?: { anchor?: string; marginPx?: number } }>,
): { warnings: string[]; simultaneousMax: number } => {
  const warnings: string[] = [];
  const areas = getOverlaySafeAreas();
  const captionBand = getCaptionBand();

  const events: Array<{ t: number; delta: number }> = [];
  for (const o of overlays) {
    events.push({ t: o.startMs, delta: 1 });
    events.push({ t: o.endMs, delta: -1 });
  }
  events.sort((a, b) => a.t - b.t);

  let current = 0;
  let simultaneousMax = 0;
  for (const e of events) {
    current += e.delta;
    if (current > simultaneousMax) {
      simultaneousMax = current;
    }
  }

  if (simultaneousMax > 2) {
    warnings.push(`More than 2 overlays overlap at once (max ${simultaneousMax}).`);
  }

  for (const o of overlays) {
    const anchor = o.position?.anchor ?? "bottom_right";
    const marginPx = o.position?.marginPx ?? 80;
    const rect = anchorToRect(
      anchor,
      marginPx,
      320,
      120,
      areas.frameWidth,
      areas.frameHeight,
    );
    if (detectCaptionOverlap(rect, captionBand)) {
      warnings.push("An overlay may cover the caption safe area.");
      break;
    }
  }

  return { warnings, simultaneousMax };
};
