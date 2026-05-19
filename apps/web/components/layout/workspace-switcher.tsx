"use client";

import { setActiveWorkspace } from "@/app/actions/workspace";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type WorkspaceRow = {
  id: string;
  name: string;
};

type Props = {
  activeWorkspaceId: string;
  activeWorkspaceName: string;
};

export const WorkspaceSwitcher = ({
  activeWorkspaceId,
  activeWorkspaceName,
}: Props) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const { data: workspaces } = useQuery({
    queryKey: ["workspaces"],
    queryFn: async () => {
      const res = await fetch("/api/workspaces");
      const json = (await res.json()) as { data?: WorkspaceRow[] };
      return json.data ?? [];
    },
  });

  const handleSelect = async (workspaceId: string) => {
    if (workspaceId === activeWorkspaceId) {
      setOpen(false);
      return;
    }
    await setActiveWorkspace(workspaceId);
    setOpen(false);
    router.refresh();
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center gap-2 rounded-lg border border-border bg-panel-2 px-3 py-1.5 text-sm",
          "hover:border-accent-cyan/50",
        )}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className="max-w-[140px] truncate font-medium">
          {activeWorkspaceName}
        </span>
        <ChevronDown className="h-4 w-4 text-muted" />
      </button>
      {open && (
        <ul
          role="listbox"
          className="absolute right-0 z-50 mt-1 min-w-[200px] rounded-lg border border-border bg-panel py-1 shadow-lg"
        >
          {workspaces?.map((ws) => (
            <li key={ws.id}>
              <button
                type="button"
                role="option"
                aria-selected={ws.id === activeWorkspaceId}
                className={cn(
                  "w-full px-3 py-2 text-left text-sm hover:bg-panel-2",
                  ws.id === activeWorkspaceId && "text-accent-cyan",
                )}
                onClick={() => void handleSelect(ws.id)}
              >
                {ws.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
