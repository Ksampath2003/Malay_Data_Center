"use client";

import dynamic from "next/dynamic";
import { useState, useMemo } from "react";
import datacenters from "@/data/datacenters.json";
import operators from "@/data/operators.json";
import type { DataCenter, Operator, ProjectStatus, Country } from "@/lib/types";
import type { MapFilters } from "@/components/MapView";
import { fmtMW, fmtUSD_MM, fmtInt } from "@/lib/calculations";

// Leaflet touches `window` at import — must be client-only.
const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => (
    <div className="h-[540px] rounded-lg skeleton" />
  ),
});

const ALL_STATUSES: ProjectStatus[] = [
  "operational",
  "under_construction",
  "committed",
  "planned",
  "early_stage",
];
const COUNTRIES: (Country | "ALL")[] = ["ALL", "US", "China", "Singapore", "Malaysia", "UAE", "Japan"];

const STATUS_COLOR: Record<ProjectStatus, string> = {
  operational: "#34D399",
  under_construction: "#FBBF24",
  committed: "#60A5FA",
  planned: "#A78BFA",
  early_stage: "#94A3B8",
};
const STATUS_LABEL: Record<ProjectStatus, string> = {
  operational: "Operational",
  under_construction: "Under construction",
  committed: "Committed",
  planned: "Planned",
  early_stage: "Early stage",
};

export default function MapPage() {
  const [statuses, setStatuses] = useState<Set<ProjectStatus>>(new Set(ALL_STATUSES));
  const [countries, setCountries] = useState<Set<Country | "ALL">>(new Set(["ALL"]));
  const [minMW, setMinMW] = useState(0);
  const [showHeat, setShowHeat] = useState(true);

  const filters: MapFilters = { statuses, countries, minMW };

  // Live stats for sidebar
  const dcs = datacenters as DataCenter[];
  const opMap = useMemo(
    () => Object.fromEntries((operators as Operator[]).map((o) => [o.id, o])),
    [],
  );

  const visible = useMemo(() => {
    return dcs.filter((d) => {
      if (!statuses.has(d.status)) return false;
      if (d.capacityMW < minMW) return false;
      if (!countries.has("ALL")) {
        const op = opMap[d.operatorId];
        if (!op || !countries.has(op.country)) return false;
      }
      return true;
    });
  }, [dcs, statuses, countries, minMW, opMap]);

  const totals = useMemo(() => ({
    count: visible.length,
    mw: visible.reduce((s, d) => s + d.capacityMW, 0),
    capex: visible.reduce((s, d) => s + d.capexUSD_MM, 0),
  }), [visible]);

  const toggleStatus = (s: ProjectStatus) =>
    setStatuses((prev) => {
      const next = new Set(prev);
      next.has(s) ? next.delete(s) : next.add(s);
      return next;
    });

  const setCountry = (c: Country | "ALL") =>
    setCountries(() => new Set([c]));

  return (
    <div className="space-y-6">
      <header>
        <div className="eyebrow">SECTION</div>
        <h2 className="text-2xl font-semibold tracking-tight mt-1">Map</h2>
        <p className="text-[13px] text-ink-300 mt-2 max-w-3xl leading-relaxed">
          Geographic distribution of tracked data centers across Johor and the Greater Kuala Lumpur
          metropolitan area. Marker area scales with MW capacity, color encodes project status.
          Use the filters to isolate by stage, operator origin, or scale.
        </p>
      </header>

      <div className="grid lg:grid-cols-[1fr_280px] gap-6">
        <div className="panel p-3">
          <MapView filters={filters} showHeat={showHeat} />
        </div>

        <aside className="space-y-5">
          <div className="panel p-4">
            <div className="eyebrow mb-2">VISIBLE</div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-lg font-semibold num">{fmtInt(totals.count)}</div>
                <div className="text-[10px] eyebrow">PROJECTS</div>
              </div>
              <div>
                <div className="text-lg font-semibold num">{fmtMW(totals.mw)}</div>
                <div className="text-[10px] eyebrow">CAPACITY</div>
              </div>
              <div>
                <div className="text-lg font-semibold num">{fmtUSD_MM(totals.capex)}</div>
                <div className="text-[10px] eyebrow">CAPEX</div>
              </div>
            </div>
          </div>

          <div className="panel p-4">
            <div className="eyebrow mb-2">STATUS</div>
            <div className="space-y-1.5">
              {ALL_STATUSES.map((s) => {
                const on = statuses.has(s);
                return (
                  <button
                    key={s}
                    onClick={() => toggleStatus(s)}
                    className={`w-full flex items-center gap-2 text-[12px] px-2 py-1 rounded ${
                      on ? "bg-white/[0.04] text-ink-100" : "text-ink-500"
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full ring-2"
                      style={{ background: STATUS_COLOR[s], boxShadow: on ? "none" : "inset 0 0 0 6px var(--panel)" }}
                    />
                    {STATUS_LABEL[s]}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="panel p-4">
            <div className="eyebrow mb-2">OPERATOR COUNTRY</div>
            <div className="flex flex-wrap gap-1.5">
              {COUNTRIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setCountry(c)}
                  className={`px-2 py-1 text-[11px] rounded border ${
                    countries.has(c)
                      ? "bg-accent-500 text-white border-accent-500"
                      : "border-[color:var(--border)] text-ink-300 hover:text-ink-100"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="panel p-4">
            <div className="flex justify-between text-[11px] text-ink-300 mb-1">
              <span>Minimum MW</span>
              <span className="num text-ink-100 font-medium">{minMW}</span>
            </div>
            <input
              type="range"
              min={0}
              max={300}
              step={10}
              value={minMW}
              onChange={(e) => setMinMW(parseInt(e.target.value))}
              className="w-full accent-accent-500"
            />
          </div>

          <div className="panel p-4">
            <label className="flex items-center gap-2 text-[12px] cursor-pointer">
              <input
                type="checkbox"
                checked={showHeat}
                onChange={(e) => setShowHeat(e.target.checked)}
                className="accent-accent-500"
              />
              Show density halo
            </label>
            <div className="text-[11px] text-ink-400 mt-1">
              Soft circles overlay raw capacity density.
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
