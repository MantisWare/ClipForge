import { DiscoverClient } from "@/components/discover/discover-client";
import { getSessionUserId } from "@/lib/auth";
import { getActiveWorkspace } from "@/lib/workspace-context";
import { redirect } from "next/navigation";

export default async function DiscoverPage() {
  const userId = await getSessionUserId();
  if (userId === null) {
    redirect("/sign-in");
  }

  const workspace = await getActiveWorkspace(userId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Discover</h1>
        <p className="mt-1 text-sm text-muted">
          Browse popular and trending YouTube videos to repurpose as Shorts.
        </p>
      </div>
      <DiscoverClient workspaceId={workspace.id} />
    </div>
  );
}
