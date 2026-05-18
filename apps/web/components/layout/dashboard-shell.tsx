import { Sidebar } from "@/components/layout/sidebar";
import { auth, signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import type { ReactNode } from "react";

export const DashboardShell = async ({
  children,
}: {
  children: ReactNode;
}) => {
  const session = await auth();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b border-border bg-panel px-6">
          <p className="text-sm text-muted">
            {session?.user?.email ?? "Signed in"}
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
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
};
