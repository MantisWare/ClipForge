import { AccountsClient } from "@/components/accounts/accounts-client";
import { getSessionUserId } from "@/lib/auth";
import { getActiveWorkspace } from "@/lib/workspace-context";
import { redirect } from "next/navigation";

export default async function AccountsPage() {
  const userId = await getSessionUserId();
  if (userId === null) {
    redirect("/sign-in");
  }

  const workspace = await getActiveWorkspace(userId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Connected accounts</h1>
        <p className="mt-1 text-sm text-muted">
          Connect YouTube to publish Shorts. TikTok and Instagram use export
          fallback until app audit.
        </p>
      </div>
      <AccountsClient workspaceId={workspace.id} />
    </div>
  );
}
