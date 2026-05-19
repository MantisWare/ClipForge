export type RenderConfig = {
  outputWidth: number;
  outputHeight: number;
  outputFps: number;
  hookDurationMs: number;
  safeMarginTop: number;
  safeMarginBottom: number;
  safeMarginSides: number;
};

export const getRenderConfig = (): RenderConfig => ({
  outputWidth: 1080,
  outputHeight: 1920,
  outputFps: 30,
  hookDurationMs: 3_000,
  safeMarginTop: 180,
  safeMarginBottom: 320,
  safeMarginSides: 80,
});

export const buildRenderedStorageKey = (
  workspaceId: string,
  renderedClipId: string,
  filename = "output.mp4",
): string =>
  ["workspaces", workspaceId, "renders", renderedClipId, filename].join("/");
