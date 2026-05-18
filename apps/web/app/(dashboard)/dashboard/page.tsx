import { HeroImportCard } from "@/components/dashboard/hero-import-card";
import { ProcessingQueue } from "@/components/dashboard/processing-queue";
import { RecentProjects } from "@/components/dashboard/recent-projects";
import { getSessionUserId } from "@/lib/auth";
import { getOrCreateDefaultWorkspace } from "@/lib/workspace";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const userId = await getSessionUserId();
  if (userId === null) {
    redirect("/sign-in");
  }

  const workspace = await getOrCreateDefaultWorkspace(userId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted">
          Workspace: {workspace.name}
        </p>
      </div>
      <HeroImportCard workspaceId={workspace.id} />
      <div className="grid gap-6 lg:grid-cols-2">
        <ProcessingQueue workspaceId={workspace.id} />
        <RecentProjects workspaceId={workspace.id} />
      </div>
    </div>
  );
}
