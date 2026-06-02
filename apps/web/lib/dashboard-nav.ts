import type { LucideIcon } from "lucide-react";
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

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export type NavSection = {
  id: string;
  title: string;
  items: NavItem[];
};

/** Setup once, then day-to-day workflow in pipeline order. */
export const NAV_SECTIONS: NavSection[] = [
  {
    id: "setup",
    title: "Setup",
    items: [
      { href: "/accounts", label: "Connected Accounts", icon: Link2 },
      { href: "/brand-kits", label: "Brand Kits", icon: Palette },
      { href: "/monetization", label: "Monetization", icon: DollarSign },
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
  {
    id: "workflow",
    title: "Create & publish",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/discover", label: "Discover", icon: Compass },
      { href: "/projects/new", label: "New Project", icon: PlusCircle },
      { href: "/projects", label: "Projects", icon: Film },
      { href: "/clips", label: "Clips", icon: Clapperboard },
      { href: "/calendar", label: "Calendar", icon: Calendar },
    ],
  },
  {
    id: "insights",
    title: "Insights",
    items: [{ href: "/analytics", label: "Analytics", icon: BarChart3 }],
  },
];

export const ADMIN_NAV_ITEM: NavItem = {
  href: "/admin",
  label: "Admin",
  icon: Shield,
};

/** Active route for sidebar highlight (avoids /projects matching /projects/new). */
export const isNavItemActive = (href: string, pathname: string): boolean => {
  if (pathname === href) {
    return true;
  }
  if (!pathname.startsWith(`${href}/`)) {
    return false;
  }
  if (href === "/projects" && pathname.startsWith("/projects/new")) {
    return false;
  }
  return true;
};
