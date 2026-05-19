import { MonetizationClient } from "@/components/monetization/monetization-client";
import { getSessionUserId } from "@/lib/auth";
import { getActiveWorkspace } from "@/lib/workspace-context";
import { redirect } from "next/navigation";

export default async function MonetizationPage() {
  const userId = await getSessionUserId();
  if (userId === null) {
    redirect("/sign-in");
  }
  const workspace = await getActiveWorkspace(userId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Monetization</h1>
        <p className="mt-1 text-sm text-muted">
          Product links, overlay templates, and disclosure settings for Phase 9.
        </p>
      </div>
      <MonetizationClient workspaceId={workspace.id} />
    </div>
  );
}
