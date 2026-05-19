import { WorkspaceSettings } from "@/components/settings/workspace-settings";
import { getSessionUserId } from "@/lib/auth";
import { getActiveWorkspace } from "@/lib/workspace-context";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const userId = await getSessionUserId();
  if (userId === null) {
    redirect("/sign-in");
  }

  const workspace = await getActiveWorkspace(userId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted">
          Manage workspace and team for {workspace.name}.
        </p>
      </div>
      <WorkspaceSettings
        workspaceId={workspace.id}
        workspaceName={workspace.name}
      />
    </div>
  );
}
