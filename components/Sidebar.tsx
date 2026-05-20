"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import clsx from "clsx";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  section?: string;
}

const Icon = {
  Overview: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-4 h-4">
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  ),
  Financing: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-4 h-4">
      <path d="M3 20V8m6 12V4m6 16v-9m6 9V11" />
    </svg>
  ),
  Map: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-4 h-4">
      <path d="M9 3 3 5v16l6-2 6 2 6-2V3l-6 2-6-2Z" />
      <path d="M9 3v16M15 5v16" />
    </svg>
  ),
  Capacity: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-4 h-4">
      <path d="M3 17c4-10 8-8 12 0M3 21h18" />
      <circle cx="7" cy="11" r="1" /><circle cx="15" cy="11" r="1" />
    </svg>
  ),
  Grid: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-4 h-4">
      <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />
    </svg>
  ),
  Risk: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-4 h-4">
      <path d="M12 2 2 7l10 5 10-5-10-5Z" />
      <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
    </svg>
  ),
  Companies: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-4 h-4">
      <circle cx="7" cy="9" r="3" /><circle cx="17" cy="14" r="4" /><circle cx="13" cy="5" r="2" />
    </svg>
  ),
  Timeline: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-4 h-4">
      <path d="M12 3v18" />
      <circle cx="12" cy="7" r="2" /><circle cx="12" cy="13" r="2" /><circle cx="12" cy="19" r="2" />
    </svg>
  ),
  Methodology: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-4 h-4">
      <path d="M4 4h12l4 4v12H4z" />
      <path d="M16 4v4h4M8 12h8M8 16h8M8 8h4" />
    </svg>
  ),
};

const NAV: NavItem[] = [
  { href: "/",                  label: "Overview",            icon: Icon.Overview,    section: "ANALYSIS" },
  { href: "/financing",         label: "Financing",           icon: Icon.Financing },
  { href: "/map",               label: "Map",                 icon: Icon.Map },
  { href: "/capacity",          label: "Capacity & Forecast", icon: Icon.Capacity },
  { href: "/grid-constraints",  label: "Grid Constraints",    icon: Icon.Grid },
  { href: "/risk-comparison",   label: "Risk & Comparison",   icon: Icon.Risk },
  { href: "/companies",         label: "Companies",           icon: Icon.Companies },
  { href: "/timeline",          label: "Timeline",            icon: Icon.Timeline,    section: "REFERENCE" },
  { href: "/methodology",       label: "Methodology",         icon: Icon.Methodology },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={clsx(
        "shrink-0 border-r border-[color:var(--border)] transition-[width] duration-150 ease-out",
        collapsed ? "w-[68px]" : "w-[240px]",
      )}
      style={{ backgroundColor: "var(--panel)" }}
    >
      <div className="h-16 flex items-center px-4 border-b border-[color:var(--border)] justify-between">
        <Link href="/" className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-md bg-accent-500 flex items-center justify-center text-white font-bold text-[12px] shrink-0">
            MY
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="text-[11px] eyebrow leading-none">PROJECT</div>
              <div className="text-[13px] font-semibold leading-tight truncate">DC Intel · MY</div>
            </div>
          )}
        </Link>
        <button
          aria-label="Toggle sidebar"
          onClick={() => setCollapsed((c) => !c)}
          className="text-ink-300 hover:text-ink-100 p-1"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <path d={collapsed ? "M9 6l6 6-6 6" : "M15 6l-6 6 6 6"} />
          </svg>
        </button>
      </div>

      <nav className="py-3">
        {NAV.map((item, i) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <div key={item.href}>
              {!collapsed && item.section && (
                <div className="eyebrow px-4 pt-4 pb-1">{item.section}</div>
              )}
              <Link
                href={item.href}
                className={clsx(
                  "flex items-center gap-3 px-4 py-2 text-[13px] transition-colors border-l-2",
                  active
                    ? "text-ink-50 border-accent-500 bg-white/[0.03]"
                    : "text-ink-300 border-transparent hover:text-ink-100 hover:bg-white/[0.02]",
                )}
                title={collapsed ? item.label : undefined}
              >
                <span className={active ? "text-accent-400" : "text-ink-400"}>{item.icon}</span>
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            </div>
          );
        })}
      </nav>

      {!collapsed && (
        <div className="px-4 mt-4 pt-4 border-t border-[color:var(--border)]">
          <div className="eyebrow mb-2">STATUS</div>
          <div className="flex items-center gap-2 text-[12px] text-ink-300">
            <span className="w-1.5 h-1.5 rounded-full bg-good animate-pulse" />
            Static dataset · v0.1
          </div>
        </div>
      )}
    </aside>
  );
}
