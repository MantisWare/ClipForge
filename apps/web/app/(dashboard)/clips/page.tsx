import { ClipsListClient } from "@/components/clips/clips-list-client";
import { getSessionUserId } from "@/lib/auth";
import { getActiveWorkspace } from "@/lib/workspace-context";
import { redirect } from "next/navigation";

export default async function ClipsPage() {
  const userId = await getSessionUserId();
  if (userId === null) {
    redirect("/sign-in");
  }

  const workspace = await getActiveWorkspace(userId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Clips</h1>
        <p className="mt-1 text-sm text-muted">
          Rendered vertical Shorts ready for preview, download, and publish.
        </p>
      </div>
      <ClipsListClient workspaceId={workspace.id} />
    </div>
  );
}
