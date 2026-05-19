import { ProjectsListClient } from "@/components/projects/projects-list-client";
import { getSessionUserId } from "@/lib/auth";
import { getActiveWorkspace } from "@/lib/workspace-context";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function ProjectsPage() {
  const userId = await getSessionUserId();
  if (userId === null) {
    redirect("/sign-in");
  }
  const workspace = await getActiveWorkspace(userId);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Projects</h1>
          <p className="mt-1 text-sm text-muted">
            Source videos and repurposing pipeline status.
          </p>
        </div>
        <Link
          href="/projects/new"
          className="inline-flex h-8 items-center justify-center rounded-lg bg-brand-gradient px-3 text-xs font-medium text-white"
        >
          New project
        </Link>
      </div>
      <ProjectsListClient workspaceId={workspace.id} />
    </div>
  );
}
