import type { OverlayCompliance, OverlayType } from "../schemas/overlay.js";

export type OverlaySafeAreas = {
  top: number;
  bottom: number;
  left: number;
  right: number;
};

export type OverlayRenderAssets = {
  imagePath?: string;
  imageStorageKey?: string;
  title?: string;
  cta?: string;
  promoCode?: string;
  disclosure?: string;
  qrPath?: string;
  headline?: string;
};

export type OverlayRenderItem = {
  id: string;
  type: OverlayType;
  startMs: number;
  endMs: number;
  position: {
    anchor: string;
    marginPx: number;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
  };
  style: Record<string, unknown>;
  compliance: OverlayCompliance;
  assets: OverlayRenderAssets;
};

export type ApplyOverlaysPayload = {
  renderedClipId: string;
  clipCandidateId: string;
  workspaceId: string;
  baseVideoKey: string;
  overlays: OverlayRenderItem[];
  safeAreas: OverlaySafeAreas;
  brandKit?: {
    primaryColor: string;
    fontFamily: string;
    hookFontSize: number;
    logoStorageKey?: string | null;
  };
};

export type OverlaysManifest = {
  renderedClipId: string;
  clipCandidateId: string;
  workspaceId: string;
  overlays: Array<{
    id: string;
    type: OverlayType;
    startMs: number;
    endMs: number;
    compliance: OverlayCompliance;
    productLinkId?: string;
  }>;
  generatedAt: string;
};
