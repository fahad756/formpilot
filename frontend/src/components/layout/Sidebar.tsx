"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, User, FileText, Zap } from "lucide-react";
import { clsx } from "clsx";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/profile",   label: "Profile",   icon: User },
  { href: "/resumes",   label: "Resumes",   icon: FileText },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col w-60 bg-surface border-r border-border shadow-sidebar shrink-0">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-6 py-5 border-b border-border">
        <div className="w-8 h-8 bg-primary-500 rounded-xl flex items-center justify-center">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <span className="font-bold text-text-base text-lg tracking-tight">FormPilot</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                active
                  ? "bg-primary-50 text-primary-600"
                  : "text-text-muted hover:bg-muted hover:text-text-base"
              )}
            >
              <Icon
                className={clsx("w-4 h-4 shrink-0", active ? "text-primary-500" : "text-text-muted")}
              />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer hint */}
      <div className="px-4 py-4 border-t border-border">
        <p className="text-xs text-text-muted leading-relaxed">
          Install the Chrome extension to start autofilling forms.
        </p>
      </div>
    </aside>
  );
}
