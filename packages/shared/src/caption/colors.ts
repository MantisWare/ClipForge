/** ASS primary colour: &HAABBGGRR (hex RGB input). */
export const hexToAssColor = (hex: string): string => {
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) {
    return "&H00FFFFFF";
  }
  const r = normalized.slice(0, 2);
  const g = normalized.slice(2, 4);
  const b = normalized.slice(4, 6);
  return `&H00${b}${g}${r}`.toUpperCase();
};

/** FFmpeg drawtext fontcolor (0xRRGGBB). */
export const hexToDrawtextColor = (hex: string): string => {
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) {
    return "white";
  }
  return `0x${normalized.toUpperCase()}`;
};
