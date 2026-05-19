import { apiError } from "@/lib/api";
import { prisma, RenderStatus } from "@clipforge/database";

export const assertRenderedClipReady = async (renderedClipId: string) => {
  const rendered = await prisma.renderedClip.findUnique({
    where: { id: renderedClipId },
  });
  if (rendered === null) {
    return { error: apiError("NOT_FOUND", "Rendered clip not found", 404) };
  }
  if (rendered.status !== RenderStatus.ready) {
    return {
      error: apiError("VALIDATION_ERROR", "Rendered clip must be ready", 400),
    };
  }
  return { rendered };
};
