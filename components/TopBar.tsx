"use client";

import { useTheme } from "./ThemeProvider";

export function TopBar() {
  const { theme, toggle } = useTheme();
  // Build timestamp baked at render. Static dataset; updated on rebuild.
  const updated = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <header
      className="h-16 px-8 flex items-center justify-between border-b border-[color:var(--border)] sticky top-0 z-30"
      style={{ backgroundColor: "var(--panel)" }}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          <h1 className="text-[15px] font-semibold tracking-tight truncate">
            Malaysia AI Infrastructure Intelligence
          </h1>
          <span className="text-[10px] eyebrow px-2 py-0.5 rounded border border-[color:var(--border)] text-ink-300">
            DRAFT · INTERNAL
          </span>
        </div>
        <div className="text-[11px] text-ink-400 mt-0.5">
          Hyperscaler capex into Johor &amp; Greater KL · last updated {updated}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          aria-label="Toggle theme"
          onClick={toggle}
          className="px-2.5 py-1.5 text-[12px] text-ink-200 border border-[color:var(--border)] rounded-md hover:bg-white/[0.03]"
        >
          {theme === "dark" ? "Light" : "Dark"}
        </button>
        <button
          className="px-3 py-1.5 text-[12px] font-medium text-white bg-accent-600 hover:bg-accent-500 rounded-md flex items-center gap-1.5"
          title="Report export placeholder — not wired"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
            <path d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14" />
          </svg>
          Download Report
        </button>
      </div>
    </header>
  );
}
