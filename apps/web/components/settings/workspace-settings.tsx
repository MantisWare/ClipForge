"use client";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

type MemberRow = {
  id: string;
  role: string;
  user: { id: string; email: string; name: string | null };
};

type Props = {
  workspaceId: string;
  workspaceName: string;
};

export const WorkspaceSettings = ({
  workspaceId,
  workspaceName,
}: Props) => {
  const queryClient = useQueryClient();
  const [name, setName] = useState(workspaceName);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "editor" | "viewer">(
    "editor",
  );

  const { data: members } = useQuery({
    queryKey: ["members", workspaceId],
    queryFn: async () => {
      const res = await fetch(`/api/workspaces/${workspaceId}/members`);
      const json = (await res.json()) as { data?: MemberRow[] };
      return json.data ?? [];
    },
  });

  const renameMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/workspaces/${workspaceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const json = (await res.json()) as { error?: { message: string } };
      if (json.error !== undefined) {
        throw new Error(json.error.message);
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["workspaces"] });
    },
  });

  const inviteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/workspaces/${workspaceId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      const json = (await res.json()) as { error?: { message: string } };
      if (json.error !== undefined) {
        throw new Error(json.error.message);
      }
    },
    onSuccess: () => {
      setInviteEmail("");
      void queryClient.invalidateQueries({ queryKey: ["members", workspaceId] });
    },
  });

  const createWorkspaceMutation = useMutation({
    mutationFn: async (newName: string) => {
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });
      const json = (await res.json()) as { error?: { message: string } };
      if (json.error !== undefined) {
        throw new Error(json.error.message);
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["workspaces"] });
    },
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardTitle>Workspace</CardTitle>
        <CardDescription className="mb-4">
          Rename the active workspace.
        </CardDescription>
        <div className="flex gap-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-label="Workspace name"
          />
          <Button
            type="button"
            onClick={() => renameMutation.mutate()}
            disabled={renameMutation.isPending}
          >
            Save
          </Button>
        </div>
      </Card>

      <Card>
        <CardTitle>Create workspace</CardTitle>
        <CardDescription className="mb-4">
          Add another workspace for a separate project or client.
        </CardDescription>
        <Button
          type="button"
          variant="secondary"
          onClick={() => createWorkspaceMutation.mutate("New Workspace")}
          disabled={createWorkspaceMutation.isPending}
        >
          Create workspace
        </Button>
      </Card>

      <Card>
        <CardTitle>Members</CardTitle>
        <CardDescription className="mb-4">
          Invite collaborators by email.
        </CardDescription>
        <ul className="mb-4 space-y-2">
          {members?.map((m) => (
            <li
              key={m.id}
              className="flex items-center justify-between rounded-lg border border-border bg-panel-2 px-3 py-2 text-sm"
            >
              <span>{m.user.email}</span>
              <span className="text-muted capitalize">{m.role}</span>
            </li>
          ))}
        </ul>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            type="email"
            placeholder="collaborator@example.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            aria-label="Invite email"
          />
          <select
            value={inviteRole}
            onChange={(e) =>
              setInviteRole(e.target.value as "admin" | "editor" | "viewer")
            }
            className="h-10 rounded-lg border border-border bg-panel-2 px-3 text-sm"
            aria-label="Member role"
          >
            <option value="admin">Admin</option>
            <option value="editor">Editor</option>
            <option value="viewer">Viewer</option>
          </select>
          <Button
            type="button"
            onClick={() => inviteMutation.mutate()}
            disabled={inviteEmail === "" || inviteMutation.isPending}
          >
            Invite
          </Button>
        </div>
      </Card>
    </div>
  );
};
