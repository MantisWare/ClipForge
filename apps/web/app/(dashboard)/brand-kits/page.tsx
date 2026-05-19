import { BrandKitsClient } from "@/components/brand-kits/brand-kits-client";
import { getSessionUserId } from "@/lib/auth";
import { getActiveWorkspace } from "@/lib/workspace-context";
import { redirect } from "next/navigation";

export default async function BrandKitsPage() {
  const userId = await getSessionUserId();
  if (userId === null) {
    redirect("/sign-in");
  }
  const workspace = await getActiveWorkspace(userId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Brand kits</h1>
        <p className="mt-1 text-sm text-muted">
          Workspace branding for captions and hook overlays.
        </p>
      </div>
      <BrandKitsClient workspaceId={workspace.id} />
    </div>
  );
}
