import { PlaceholderPage } from "@/components/placeholder-page";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <PlaceholderPage
      title={`Project ${id}`}
      description="Source preview, clip review, and transcript editor (Phase 4)."
    />
  );
}
