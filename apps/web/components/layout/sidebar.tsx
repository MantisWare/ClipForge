"use client";

import { cn } from "@/lib/utils";
import {
  ADMIN_NAV_ITEM,
  isNavItemActive,
  NAV_SECTIONS,
  type NavItem,
} from "@/lib/dashboard-nav";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

type SidebarProps = {
  showAdmin: boolean;
};

const NavLink = ({
  href,
  label,
  icon: Icon,
  pathname,
}: NavItem & { pathname: string }) => {
  const isActive = isNavItemActive(href, pathname);

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-lg border-l-2 px-3 py-2 text-sm transition-colors",
        isActive
          ? "border-accent-cyan bg-panel-2 text-foreground"
          : "border-transparent text-muted hover:border-accent-pink/40 hover:bg-panel-2 hover:text-foreground",
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="truncate">{label}</span>
    </Link>
  );
};

export const Sidebar = ({ showAdmin }: SidebarProps) => {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 flex-col border-r border-border bg-panel">
      <Link
        href="/dashboard"
        className="flex h-16 shrink-0 items-center gap-3 border-b border-border px-4"
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
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {NAV_SECTIONS.map((section, sectionIndex) => (
          <div key={section.id}>
            <p
              className={cn(
                "mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted",
                sectionIndex > 0 && "mt-5",
              )}
            >
              {section.title}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => (
                <li key={item.href}>
                  <NavLink {...item} pathname={pathname} />
                </li>
              ))}
            </ul>
          </div>
        ))}

        {showAdmin && (
          <div>
            <p className="mb-1 mt-5 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted">
              Platform
            </p>
            <ul className="space-y-0.5">
              <li>
                <NavLink {...ADMIN_NAV_ITEM} pathname={pathname} />
              </li>
            </ul>
          </div>
        )}
      </nav>
    </aside>
  );
};
