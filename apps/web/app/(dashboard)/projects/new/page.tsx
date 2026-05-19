import { SourceImportForm } from "@/components/sources/source-import-form";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { getSessionUserId } from "@/lib/auth";
import { getActiveWorkspace } from "@/lib/workspace-context";
import { redirect } from "next/navigation";

export default async function NewProjectPage() {
  const userId = await getSessionUserId();
  if (userId === null) {
    redirect("/sign-in");
  }

  const workspace = await getActiveWorkspace(userId);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">New project</h1>
        <p className="mt-1 text-sm text-muted">
          Step 1 — import a source video (URL or file upload).
        </p>
      </div>

      <Card>
        <CardTitle>Source</CardTitle>
        <CardDescription className="mb-4">
          YouTube, Vimeo, direct video URLs, or MP4/MOV upload.
        </CardDescription>
        <SourceImportForm
          workspaceId={workspace.id}
          redirectOnSuccess
          showFileUpload
        />
      </Card>
    </div>
  );
}
