import { hexToAssColor } from "../caption/colors.js";
import { getRenderConfig } from "../config/render.js";
import type { AssStyleTemplate } from "../types/brand-kit.js";

export type CaptionWordInput = {
  word: string;
  startMs: number;
  endMs: number;
};

const msToAssTime = (ms: number): string => {
  const totalCs = Math.floor(ms / 10);
  const cs = totalCs % 100;
  const totalSec = Math.floor(totalCs / 100);
  const s = totalSec % 60;
  const totalMin = Math.floor(totalSec / 60);
  const m = totalMin % 60;
  const h = Math.floor(totalMin / 60);
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
};

const escapeAss = (text: string): string =>
  text
    .replace(/\\/g, "\\\\")
    .replace(/\{/g, "\\{")
    .replace(/\}/g, "\\}")
    .replace(/\n/g, "\\N");

export const generateAssSubtitles = (
  words: CaptionWordInput[],
  clipStartMs: number,
  styleOverrides?: AssStyleTemplate,
): string => {
  const config = getRenderConfig();
  const playResX = config.outputWidth;
  const playResY = config.outputHeight;

  const marginL = config.safeMarginSides;
  const marginR = config.safeMarginSides;
  const marginV = config.safeMarginBottom;

  const fontName = styleOverrides?.fontName ?? "Arial";
  const fontSize = styleOverrides?.fontSize ?? 48;
  const primaryColour = hexToAssColor(styleOverrides?.primaryColor ?? "#FFFFFF");
  const outlineColour = hexToAssColor(styleOverrides?.outlineColor ?? "#000000");
  const backColour =
    styleOverrides?.backColor !== undefined
      ? hexToAssColor(styleOverrides.backColor)
      : "&H80000000";
  const bold = styleOverrides?.bold === true ? -1 : 0;
  const outline = styleOverrides?.outline ?? 2;
  const shadow = styleOverrides?.shadow ?? 1;

  const header = `[Script Info]
ScriptType: v4.00+
PlayResX: ${playResX}
PlayResY: ${playResY}

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,${fontName},${fontSize},${primaryColour},&H000000FF,${outlineColour},${backColour},${bold},0,0,0,100,100,0,0,1,${outline},${shadow},2,${marginL},${marginR},${marginV},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  if (words.length === 0) {
    return header;
  }

  const lines: string[] = [header];
  const chunkSize = 6;
  for (let i = 0; i < words.length; i += chunkSize) {
    const chunk = words.slice(i, i + chunkSize);
    const startMs = chunk[0]?.startMs ?? clipStartMs;
    const endMs = chunk[chunk.length - 1]?.endMs ?? startMs + 2000;
    const relStart = Math.max(0, startMs - clipStartMs);
    const relEnd = Math.max(relStart + 100, endMs - clipStartMs);
    const text = escapeAss(chunk.map((w) => w.word).join(" "));
    lines.push(
      `Dialogue: 0,${msToAssTime(relStart)},${msToAssTime(relEnd)},Default,,0,0,0,,${text}`,
    );
  }

  return lines.join("\n");
};
