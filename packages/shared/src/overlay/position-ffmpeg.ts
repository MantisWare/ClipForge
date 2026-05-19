import { getRenderConfig } from "../config/render.js";
import type { OverlayRenderItem } from "./renderer-contract.js";

export type FfmpegTextPosition = {
  xExpr: string;
  yExpr: string;
};

export const overlayPositionToFfmpeg = (
  position: OverlayRenderItem["position"],
  textHeightEstimate = 120,
): FfmpegTextPosition => {
  const config = getRenderConfig();
  const margin = position.marginPx ?? 80;
  const w = config.outputWidth;
  const h = config.outputHeight;

  switch (position.anchor) {
    case "top_left":
      return { xExpr: String(margin), yExpr: String(margin) };
    case "top_right":
      return { xExpr: `w-text_w-${margin}`, yExpr: String(margin) };
    case "bottom_left":
      return {
        xExpr: String(margin),
        yExpr: `h-${textHeightEstimate}-${margin}`,
      };
    case "center":
      return { xExpr: "(w-text_w)/2", yExpr: "(h-text_h)/2" };
    case "bottom_center":
      return {
        xExpr: "(w-text_w)/2",
        yExpr: `h-${textHeightEstimate}-${margin}`,
      };
    case "bottom_right":
    default:
      return {
        xExpr: `w-text_w-${margin}`,
        yExpr: `h-${textHeightEstimate}-${margin}`,
      };
  }
};
