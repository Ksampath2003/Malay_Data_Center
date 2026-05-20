"use client";

import { useMemo, useState } from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import operators from "@/data/operators.json";
import datacenters from "@/data/datacenters.json";
import { ChartContainer } from "@/components/ChartContainer";
import { fmtMW, fmtUSD_MM, fmtInt } from "@/lib/calculations";
import type { DataCenter, Operator, Country } from "@/lib/types";

const COUNTRY_COLOR: Record<string, string> = {
  US: "#60A5FA",
  China: "#F87171",
  Singapore: "#34D399",
  Malaysia: "#FBBF24",
  UAE: "#A78BFA",
  Japan: "#F472B6",
  Other: "#94A3B8",
};

export default function CompaniesPage() {
  const [filter, setFilter] = useState<Country | "ALL">("ALL");

  const dcs = datacenters as DataCenter[];
  const ops = operators as Operator[];

  // Aggregate by operator: total capex, MW, jobs.
  const rows = useMemo(() => {
    return ops
      .map((op) => {
        const projs = dcs.filter((d) => d.operatorId === op.id);
        if (projs.length === 0) return null;
        const capex = projs.reduce((s, p) => s + p.capexUSD_MM, 0);
        const mw = projs.reduce((s, p) => s + p.capacityMW, 0);
        const jobs = projs.reduce((s, p) => s + (p.jobsCreated ?? 0), 0);
        return {
          ...op,
          capex,
          mw,
          jobs,
          projects: projs.length,
        };
      })
      .filter((r): r is NonNullable<typeof r> => !!r);
  }, [ops, dcs]);

  const filtered = filter === "ALL" ? rows : rows.filter((r) => r.country === filter);
  const [selected, setSelected] = useState(rows[0]?.id ?? null);
  const selectedRow = filtered.find((r) => r.id === selected) ?? filtered[0];
  const selectedProjects = selectedRow
    ? dcs.filter((d) => d.operatorId === selectedRow.id)
    : [];

  return (
    <div className="space-y-6">
      <header>
        <div className="eyebrow">SECTION</div>
        <h2 className="text-2xl font-semibold tracking-tight mt-1">Companies</h2>
        <p className="text-[13px] text-ink-300 mt-2 max-w-3xl leading-relaxed">
          Capital intensity (capex) vs. delivered capacity (MW), sized by jobs created and colored by
          country of origin. US hyperscalers dominate the upper-right quadrant; Asian colocators
          cluster around capital-efficient infill capacity.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {["ALL", "US", "Malaysia", "Singapore", "China", "UAE"].map((c) => (
          <button
            key={c}
            onClick={() => setFilter(c as Country | "ALL")}
            className={`px-3 py-1 text-[11px] eyebrow rounded border ${
              filter === c
                ? "bg-accent-500 text-white border-accent-500"
                : "border-[color:var(--border)] text-ink-300 hover:text-ink-100"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <ChartContainer
        title="Capex vs. capacity, bubble = jobs"
        subtitle="Each bubble is one operator. Click to drill into their Malaysian project book."
        source="Project commitment book — placeholder dataset"
      >
        <ResponsiveContainer width="100%" height={420}>
          <ScatterChart margin={{ top: 16, right: 16, bottom: 24, left: 16 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              type="number"
              dataKey="capex"
              name="Capex ($MM)"
              tickFormatter={(v) => `$${(v / 1000).toFixed(1)}B`}
              label={{ value: "Committed capex", position: "bottom", fill: "#8497B8", fontSize: 11 }}
            />
            <YAxis
              type="number"
              dataKey="mw"
              name="MW"
              tickFormatter={(v) => `${v} MW`}
              label={{ value: "Capacity (MW)", angle: -90, position: "left", fill: "#8497B8", fontSize: 11 }}
            />
            <ZAxis type="number" dataKey="jobs" range={[60, 800]} />
            <Tooltip
              cursor={{ strokeDasharray: "3 3" }}
              contentStyle={{
                background: "#0B1220",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={(value: any, key: string) => {
                if (key === "capex") return [fmtUSD_MM(value), "Capex"];
                if (key === "mw") return [fmtMW(value), "Capacity"];
                if (key === "jobs") return [fmtInt(value), "Jobs"];
                return [value, key];
              }}
              labelFormatter={() => ""}
            />
            <Scatter
              data={filtered}
              onClick={(d: any) => setSelected(d.id)}
              cursor="pointer"
            >
              {filtered.map((r) => (
                <Cell key={r.id} fill={COUNTRY_COLOR[r.country] ?? "#94A3B8"} stroke="#0B1220" />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </ChartContainer>

      {selectedRow && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="panel p-5">
            <div className="eyebrow">OPERATOR</div>
            <div className="text-lg font-semibold mt-1">{selectedRow.name}</div>
            <div className="text-[12px] text-ink-300 mt-0.5">{selectedRow.country} · {selectedRow.type}</div>
            <div className="grid grid-cols-2 gap-3 mt-4 text-[12px]">
              <KV label="Projects" value={fmtInt(selectedRow.projects)} />
              <KV label="Total Capex" value={fmtUSD_MM(selectedRow.capex)} />
              <KV label="Total Capacity" value={fmtMW(selectedRow.mw)} />
              <KV label="Jobs Created" value={fmtInt(selectedRow.jobs)} />
            </div>
          </div>
          <div className="lg:col-span-2 panel p-5">
            <div className="eyebrow mb-3">PROJECT BOOK</div>
            <div className="space-y-2">
              {selectedProjects.map((p) => (
                <div key={p.id} className="flex items-center justify-between border-b border-[color:var(--border)]/60 last:border-0 py-2 text-[12px]">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{p.name}</div>
                    <div className="text-ink-400 text-[11px]">{p.region} · {p.status.replace(/_/g, " ")}</div>
                  </div>
                  <div className="text-right num">
                    <div>{fmtMW(p.capacityMW)}</div>
                    <div className="text-ink-400 text-[11px]">{fmtUSD_MM(p.capexUSD_MM)}</div>
                  </div>
                </div>
              ))}
              {selectedProjects.length === 0 && (
                <div className="text-[12px] text-ink-400">No projects.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="eyebrow">{label}</div>
      <div className="text-base font-semibold num mt-0.5">{value}</div>
    </div>
  );
}
