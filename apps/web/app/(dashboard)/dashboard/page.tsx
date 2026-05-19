import { ConnectedAccountsSummary } from "@/components/dashboard/connected-accounts-summary";
import { HeroImportCard } from "@/components/dashboard/hero-import-card";
import { ProcessingQueue } from "@/components/dashboard/processing-queue";
import { RecentProjects } from "@/components/dashboard/recent-projects";
import { ScheduledPostsPanel } from "@/components/dashboard/scheduled-posts-panel";
import { getSessionUserId } from "@/lib/auth";
import { getActiveWorkspace } from "@/lib/workspace-context";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const userId = await getSessionUserId();
  if (userId === null) {
    redirect("/sign-in");
  }

  const workspace = await getActiveWorkspace(userId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted">Workspace: {workspace.name}</p>
      </div>
      <HeroImportCard workspaceId={workspace.id} />
      <div className="grid gap-6 lg:grid-cols-2">
        <ProcessingQueue workspaceId={workspace.id} />
        <RecentProjects workspaceId={workspace.id} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <ConnectedAccountsSummary workspaceId={workspace.id} />
        <ScheduledPostsPanel workspaceId={workspace.id} />
      </div>
    </div>
  );
}
