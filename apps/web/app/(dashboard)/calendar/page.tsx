import { CalendarClient } from "@/components/calendar/calendar-client";
import { getSessionUserId } from "@/lib/auth";
import { getActiveWorkspace } from "@/lib/workspace-context";
import { redirect } from "next/navigation";

export default async function CalendarPage() {
  const userId = await getSessionUserId();
  if (userId === null) {
    redirect("/sign-in");
  }
  const workspace = await getActiveWorkspace(userId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Content calendar</h1>
        <p className="mt-1 text-sm text-muted">
          Schedule YouTube publishes for rendered clips.
        </p>
      </div>
      <CalendarClient workspaceId={workspace.id} />
    </div>
  );
}
