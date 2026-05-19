import { RenderPreviewClient } from "@/components/clips/render-preview-client";

export default async function RenderPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <RenderPreviewClient renderedId={id} />;
}
