"use client";

import { useMemo, useState } from "react";
import timeline from "@/data/timeline.json";
import type { TimelineEvent } from "@/lib/types";

const TYPE_COLOR: Record<TimelineEvent["type"], string> = {
  investment: "#60A5FA",
  policy: "#FBBF24",
  tariff: "#F472B6",
  geopolitical: "#F87171",
  infrastructure: "#34D399",
};

const TYPES: TimelineEvent["type"][] = [
  "investment",
  "policy",
  "tariff",
  "geopolitical",
  "infrastructure",
];

export default function TimelinePage() {
  const [active, setActive] = useState<Set<string>>(new Set(TYPES));

  const events = useMemo(() => {
    return (timeline as TimelineEvent[])
      .filter((e) => active.has(e.type))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [active]);

  const toggle = (t: TimelineEvent["type"]) =>
    setActive((prev) => {
      const next = new Set(prev);
      next.has(t) ? next.delete(t) : next.add(t);
      return next;
    });

  return (
    <div className="space-y-6">
      <header>
        <div className="eyebrow">SECTION</div>
        <h2 className="text-2xl font-semibold tracking-tight mt-1">Timeline</h2>
        <p className="text-[13px] text-ink-300 mt-2 max-w-3xl leading-relaxed">
          Major events shaping the Malaysian data center investment thesis, 2022–2026. Filter by
          event type. Geopolitical and policy markers cluster around 2024, the inflection year.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {TYPES.map((t) => (
          <button
            key={t}
            onClick={() => toggle(t)}
            className={`px-3 py-1 text-[11px] eyebrow rounded border flex items-center gap-2 ${
              active.has(t)
                ? "border-[color:var(--border)] bg-white/[0.04] text-ink-100"
                : "border-[color:var(--border)] text-ink-500"
            }`}
          >
            <span className="w-2 h-2 rounded-full" style={{ background: TYPE_COLOR[t] }} />
            {t}
          </button>
        ))}
      </div>

      <div className="relative panel p-6">
        <div className="absolute top-6 bottom-6 left-[112px] w-px bg-[color:var(--border)]" />
        <div className="space-y-5">
          {events.map((e) => (
            <div key={e.date + e.title} className="grid grid-cols-[96px_24px_1fr] items-start gap-3">
              <div className="num text-[11px] text-ink-400 pt-0.5">{e.date}</div>
              <div className="flex items-center justify-center pt-1">
                <span
                  className="w-2.5 h-2.5 rounded-full ring-4 ring-[color:var(--panel)]"
                  style={{ background: TYPE_COLOR[e.type] }}
                />
              </div>
              <div>
                <div className="text-[13px] font-semibold leading-snug">{e.title}</div>
                <div className="text-[12px] text-ink-300 mt-1 leading-snug">{e.body}</div>
                <div className="text-[10px] eyebrow mt-2" style={{ color: TYPE_COLOR[e.type] }}>
                  {e.type}{" "}
                  <span className="text-ink-500 ml-2">SRC · {e.source}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
