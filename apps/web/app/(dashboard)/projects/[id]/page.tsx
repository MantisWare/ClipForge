import { ProjectDetailClient } from "@/components/sources/project-detail-client";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ProjectDetailClient sourceId={id} />;
}
