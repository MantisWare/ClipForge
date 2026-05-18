export const palette = {
  background: "#0B0F17",
  panel: "#111827",
  panel2: "#172033",
  border: "#263244",
  text: "#F8FAFC",
  muted: "#94A3B8",
  accent: "#F97316",
  success: "#22C55E",
  warning: "#FACC15",
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
