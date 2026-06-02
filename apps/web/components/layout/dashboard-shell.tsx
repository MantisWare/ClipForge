import { Sidebar } from "@/components/layout/sidebar";
import { WorkspaceSwitcher } from "@/components/layout/workspace-switcher";
import { isPlatformAdmin } from "@/lib/admin-auth";
import { auth, getSessionUserId, signOut } from "@/lib/auth";
import { getActiveWorkspace } from "@/lib/workspace-context";
import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

export const DashboardShell = async ({
  children,
}: {
  children: ReactNode;
}) => {
  const session = await auth();
  const userId = await getSessionUserId();
  if (userId === null) {
    redirect("/sign-in");
  }

  const workspace = await getActiveWorkspace(userId);
  const showAdmin = isPlatformAdmin(userId);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar showAdmin={showAdmin} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between gap-4 border-b border-border bg-panel px-6">
          <WorkspaceSwitcher
            activeWorkspaceId={workspace.id}
            activeWorkspaceName={workspace.name}
          />
          <div className="flex items-center gap-4">
            <p className="hidden text-sm text-muted sm:block">
              {session?.user?.email ?? ""}
            </p>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/sign-in" });
              }}
            >
              <Button type="submit" variant="ghost" size="sm">
                Sign out
              </Button>
            </form>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
};
