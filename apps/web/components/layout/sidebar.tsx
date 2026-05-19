"use client";

import { cn } from "@/lib/utils";
import {
  BarChart3,
  Calendar,
  Clapperboard,
  Compass,
  DollarSign,
  Film,
  LayoutDashboard,
  Link2,
  Palette,
  PlusCircle,
  Settings,
  Shield,
} from "lucide-react";
import Image from "next/image";
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
  { href: "/monetization", label: "Monetization", icon: DollarSign },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/admin", label: "Admin", icon: Shield },
] as const;

export const Sidebar = () => {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 flex-col border-r border-border bg-panel">
      <Link
        href="/dashboard"
        className="flex h-16 items-center gap-3 border-b border-border px-4"
      >
        <Image
          src="/logo.png"
          alt="ClipForge AI"
          width={36}
          height={36}
          className="h-9 w-9 object-contain"
          priority
        />
        <span className="text-lg font-bold text-brand-gradient">ClipForge</span>
      </Link>
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg border-l-2 px-3 py-2 text-sm transition-colors",
                isActive
                  ? "border-accent-cyan bg-panel-2 text-foreground"
                  : "border-transparent text-muted hover:border-accent-pink/40 hover:bg-panel-2 hover:text-foreground",
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
