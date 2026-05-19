import type { OverlayType } from "../schemas/overlay.js";

export type BuiltinOverlayTemplate = {
  name: string;
  overlayType: OverlayType;
  config: Record<string, unknown>;
};

export const BUILTIN_OVERLAY_TEMPLATES: BuiltinOverlayTemplate[] = [
  {
    name: "Minimal end slate",
    overlayType: "end_slate",
    config: {
      headline: "Follow for more",
      cta: "Link in bio",
      durationMs: 3000,
    },
  },
  {
    name: "Bold CTA",
    overlayType: "end_slate",
    config: {
      headline: "Tap the link",
      cta: "Shop now",
      durationMs: 3500,
      accent: true,
    },
  },
  {
    name: "Product focus pin",
    overlayType: "product_pin",
    config: {
      cta: "Shop",
      durationMs: 6000,
    },
  },
  {
    name: "Affiliate lower-third",
    overlayType: "affiliate_bar",
    config: {
      disclosure: "Links may earn a commission.",
      durationMs: 8000,
    },
  },
  {
    name: "Podcast sponsor bar",
    overlayType: "sponsor_segment",
    config: {
      label: "Paid partnership",
      opacity: 0.75,
    },
  },
  {
    name: "Promo code flash",
    overlayType: "promo_code",
    config: {
      durationMs: 2500,
    },
  },
];
