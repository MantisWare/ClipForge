import type { AssStyleTemplate, CaptionPresetKey } from "../types/brand-kit.js";

export type BuiltinCaptionPreset = {
  presetKey: CaptionPresetKey;
  name: string;
  assTemplate: AssStyleTemplate;
};

export const BUILTIN_CAPTION_PRESETS: BuiltinCaptionPreset[] = [
  {
    presetKey: "minimal",
    name: "Minimal",
    assTemplate: {
      fontName: "Arial",
      fontSize: 44,
      primaryColor: "#FFFFFF",
      outlineColor: "#000000",
      bold: false,
      outline: 2,
      shadow: 1,
    },
  },
  {
    presetKey: "tiktok_highlight",
    name: "TikTok highlight",
    assTemplate: {
      fontName: "Arial Black",
      fontSize: 52,
      primaryColor: "#FFFF00",
      outlineColor: "#000000",
      bold: true,
      outline: 3,
      shadow: 2,
    },
  },
  {
    presetKey: "podcast_bold",
    name: "Podcast bold",
    assTemplate: {
      fontName: "Impact",
      fontSize: 56,
      primaryColor: "#FFFFFF",
      outlineColor: "#333333",
      bold: true,
      outline: 2,
      shadow: 0,
    },
  },
  {
    presetKey: "corporate",
    name: "Corporate",
    assTemplate: {
      fontName: "Helvetica",
      fontSize: 42,
      primaryColor: "#E8E8E8",
      outlineColor: "#1A1A1A",
      bold: false,
      outline: 1,
      shadow: 0,
    },
  },
  {
    presetKey: "high_energy",
    name: "High energy",
    assTemplate: {
      fontName: "Arial Black",
      fontSize: 58,
      primaryColor: "#FF4444",
      outlineColor: "#FFFFFF",
      bold: true,
      outline: 4,
      shadow: 2,
    },
  },
];
