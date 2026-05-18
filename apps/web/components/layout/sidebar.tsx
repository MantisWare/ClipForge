"use client";

import { cn } from "@/lib/utils";
import {
  BarChart3,
  Calendar,
  Clapperboard,
  Compass,
  Film,
  LayoutDashboard,
  Link2,
  Palette,
  PlusCircle,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/discover", label: "Discover", icon: Compass },
  { href: "/projects/new", label: "New Project", icon: PlusCircle },
  { href: "/projects", label: "Projects", icon: Film },
  { href: "/clips", label: "Clips", icon: Clapperboard },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/accounts", label: "Connected Accounts", icon: Link2 },
  { href: "/brand-kits", label: "Brand Kits", icon: Palette },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export const Sidebar = () => {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 flex-col border-r border-border bg-panel">
      <div className="flex h-16 items-center gap-2 border-b border-border px-6">
        <span className="text-xl font-bold text-accent">ClipForge</span>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-panel-2 text-accent"
                  : "text-muted hover:bg-panel-2 hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};
