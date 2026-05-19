import { prisma } from "@clipforge/database";

export const fireRenderWebhook = async (
  workspaceId: string,
  renderedClipId: string,
  variant: "clean" | "monetized",
): Promise<void> => {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { renderWebhookUrl: true },
  });
  const url = workspace?.renderWebhookUrl;
  if (url === null || url === undefined || url === "") {
    return;
  }
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "render.complete",
        renderedClipId,
        workspaceId,
        variant,
      }),
    });
  } catch {
    /* webhook is best-effort */
  }
};
