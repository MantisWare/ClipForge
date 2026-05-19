import { ClipDetailClient } from "@/components/overlays/clip-detail-client";
import type { ClipCandidateRow } from "@/components/clips/clip-candidate-card";
import { getSessionUserId } from "@/lib/auth";
import { getActiveWorkspace } from "@/lib/workspace-context";
import { prisma } from "@clipforge/database";
import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ sourceId: string; clipId: string }>;
};

export default async function ClipDetailPage(props: Props) {
  const { sourceId, clipId } = await props.params;

  const userId = await getSessionUserId();
  if (userId === null) {
    redirect("/sign-in");
  }

  const workspace = await getActiveWorkspace(userId);
  const source = await prisma.sourceVideo.findUnique({
    where: { id: sourceId },
    include: { clipCandidates: { where: { id: clipId } } },
  });

  if (source === null || source.workspaceId !== workspace.id) {
    redirect(`/projects`);
  }

  const clip = source.clipCandidates[0];
  if (clip === undefined) {
    redirect(`/projects/${sourceId}`);
  }

  const row: ClipCandidateRow = {
    id: clip.id,
    startMs: clip.startMs,
    endMs: clip.endMs,
    durationSeconds: clip.durationSeconds,
    transcriptExcerpt: clip.transcriptExcerpt,
    hookScore: clip.hookScore,
    viralityScore: clip.viralityScore,
    clarityScore: clip.clarityScore,
    standaloneScore: clip.standaloneScore,
    platformFitScore: clip.platformFitScore,
    overallScore: clip.overallScore,
    reasonSelected: clip.reasonSelected,
    suggestedHook: clip.suggestedHook,
    suggestedTitle: clip.suggestedTitle,
    suggestedCaption: clip.suggestedCaption,
    suggestedHashtags: clip.suggestedHashtags ?? [],
    status: clip.status,
  };

  return (
    <ClipDetailClient
      sourceId={sourceId}
      clipId={clipId}
      workspaceId={workspace.id}
      initialClip={row}
    />
  );
}
