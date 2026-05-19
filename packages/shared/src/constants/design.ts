export const palette = {
  background: "#000000",
  panel: "#0f0a14",
  panel2: "#1a1028",
  border: "#2d1f4e",
  text: "#FFFFFF",
  muted: "#94A3B8",
  accentPink: "#FF3385",
  accentOrange: "#FF8C00",
  accentCyan: "#00E5FF",
  accentPurple: "#4B0082",
  success: "#22C55E",
  warning: "#FFD700",
  danger: "#EF4444",
} as const;

export const clipLengthDefaults = {
  minSeconds: 30,
  maxSeconds: 60,
} as const;

export const captionSafeAreas = {
  top: 180,
  bottom: 320,
  left: 80,
  right: 80,
} as const;
