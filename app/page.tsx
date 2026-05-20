"use client";

import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  ComposedChart,
  ReferenceLine,
  Legend,
} from "recharts";
import { KPICard } from "@/components/KPICard";
import { ChartContainer } from "@/components/ChartContainer";
import capacity from "@/data/capacity.json";
import financing from "@/data/financing.json";
import datacenters from "@/data/datacenters.json";
import { buildForecast, fmtMW, fmtUSD_B } from "@/lib/calculations";
import type { CapacityPoint, DataCenter } from "@/lib/types";

export default function OverviewPage() {
  const { series, params } = useMemo(
    () => buildForecast(capacity.historical as CapacityPoint[], 2030, "base"),
    [],
  );

  // Aggregate top-line KPIs from project data.
  const dcs = datacenters as DataCenter[];
  const totalUSCapex = useMemo(() => {
    const usFinancierIds = new Set(["msft", "goog", "aws", "orcl", "bx", "kkr", "gip", "dgtl"]);
    return (financing.investments as any[])
      .filter((i) => usFinancierIds.has(i.financierId))
      .reduce((s, i) => s + i.amountUSD_MM, 0);
  }, []);
  const totalMW = dcs.reduce((s, d) => s + d.capacityMW, 0);
  const activeProjects = dcs.filter(
    (d) => d.status === "operational" || d.status === "under_construction",
  ).length;
  const projected2030 = series.find((s) => s.year === 2030)?.forecast ?? 0;

  return (
    <div className="space-y-8">
      <header>
        <div className="eyebrow">OVERVIEW</div>
        <h2 className="text-2xl font-semibold tracking-tight mt-1">
          The Malaysian Data Center Wave
        </h2>
        <p className="text-[13px] text-ink-300 mt-2 max-w-3xl leading-relaxed">
          US hyperscalers committed more capex to Malaysia in 2024 alone than in the prior decade
          combined. This dashboard traces the capital flows, the buildout cadence, the binding
          power constraint, and the country&apos;s position against regional alternatives. Static
          dataset; figures marked <span className="text-amber-400">placeholder</span> are analyst
          best-estimates pending source verification.
        </p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="US Capex Committed"
          value={fmtUSD_B(totalUSCapex)}
          delta="+412% YoY"
          deltaTone="good"
          context="Microsoft, Google, AWS, Oracle + US PE platforms across Johor and Greater KL."
          source="Public announcements, 2023–2025"
        />
        <KPICard
          label="Capacity in Pipeline"
          value={fmtMW(totalMW)}
          delta="487 MW live"
          deltaTone="neutral"
          context="Total IT load across operational, under-construction, and committed projects in the dataset."
          source="Operator filings + placeholder"
        />
        <KPICard
          label="Active Projects"
          value={String(activeProjects)}
          delta={`${dcs.length} total tracked`}
          deltaTone="neutral"
          context="Live + under construction. Excludes committed-but-unbroken-ground."
          source="This project's dataset"
        />
        <KPICard
          label="Projected 2030 Capacity"
          value={fmtMW(projected2030)}
          delta="Base case"
          deltaTone="good"
          context={`Logistic fit K=${params.K.toFixed(0)} MW, r=${params.r.toFixed(2)}, t₀=${params.t0.toFixed(1)}`}
          source="Model — see Methodology"
        />
      </section>

      <ChartContainer
        title="Malaysia data center capacity buildout, 2020–2030"
        subtitle="Solid line: observed live MW. Dashed: logistic-fit forecast. Shaded band: ±6%/year uncertainty (heuristic)."
        source="Cushman & Wakefield + project announcements + model"
        methodology="Logistic curve fit to 6 historical points by coordinate-descent. Forecast band widens linearly with projection horizon, capped at ±30%."
      >
        <ResponsiveContainer width="100%" height={380}>
          <ComposedChart data={series} margin={{ top: 8, right: 24, bottom: 8, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" />
            <YAxis tickFormatter={(v) => `${v.toLocaleString()} MW`} width={80} />
            <Tooltip
              contentStyle={{
                background: "#0B1220",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={(value: any) =>
                typeof value === "number" ? `${Math.round(value).toLocaleString()} MW` : value
              }
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Area
              type="monotone"
              dataKey="upper"
              stroke="none"
              fill="rgba(96,165,250,0.12)"
              isAnimationActive={false}
              legendType="none"
            />
            <Area
              type="monotone"
              dataKey="lower"
              stroke="none"
              fill="var(--bg)"
              isAnimationActive={false}
              legendType="none"
            />
            <Line type="monotone" dataKey="actual" stroke="#60A5FA" strokeWidth={2.5} name="Live MW (actual)" dot={{ r: 3 }} />
            <Line type="monotone" dataKey="fit" stroke="#60A5FA" strokeWidth={1.5} strokeDasharray="4 3" name="Model fit" dot={false} />
            <Line type="monotone" dataKey="forecast" stroke="#FBBF24" strokeWidth={2} strokeDasharray="6 4" name="Forecast (base)" dot={false} />
            <ReferenceLine x={2025} stroke="rgba(132,151,184,0.4)" strokeDasharray="2 2" label={{ value: "Today", fill: "#8497B8", fontSize: 10 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </ChartContainer>

      <section className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 panel p-5">
          <div className="eyebrow mb-3">KEY FINDINGS</div>
          <ul className="space-y-3 text-[13px] leading-relaxed">
            <Finding
              accent="#60A5FA"
              title="$16.7B+ in announced US hyperscaler capex in 18 months"
              body="Microsoft ($2.2B), Google (~$2B), AWS ($6B by 2038), and Oracle (~$6.5B) anchor the wave. Capex/MW is converging on $9–12M across operators — consistent with hyperscale-grade builds at Tier III+."
            />
            <Finding
              accent="#FBBF24"
              title="Power is the binding constraint — not capital"
              body="On base assumptions (38% demand CAGR, 8% supply CAGR), DC demand crosses TNB headroom around 2028. The grid-constraints tab lets you stress-test the assumption set."
            />
            <Finding
              accent="#34D399"
              title="Private equity controls 35–40% of Johor capacity"
              body="Blackstone (post-AirTrunk), KKR-linked vehicles, and GIC-backed platforms own a structurally large share of operating colocation MW — distinct from the hyperscaler-direct capex thesis."
            />
            <Finding
              accent="#F87171"
              title="Singapore-Johor SEZ formalization is a regulatory unlock"
              body="The 2025 SEZ framework lowers cross-border friction for the Iskandar data center belt. This is the policy lever that converts cost arbitrage into permanent platform advantage."
            />
          </ul>
        </div>

        <div className="panel p-5">
          <div className="eyebrow mb-2">WHAT THIS PROJECT COVERS</div>
          <p className="text-[12px] text-ink-200 leading-relaxed">
            A multi-tab analytical workspace tracking capital, capacity, power, and policy across
            the Malaysian data center investment cycle.
          </p>
          <ul className="mt-4 space-y-2 text-[12px] text-ink-300">
            <ListItem>Capital flows from LP → vehicle → project</ListItem>
            <ListItem>Geospatial siting decisions across Johor + KL</ListItem>
            <ListItem>Forecasting, scenarios, sensitivity heatmaps</ListItem>
            <ListItem>Regional risk benchmarking vs. SG/VN/ID</ListItem>
            <ListItem>Geopolitical timeline + policy markers</ListItem>
          </ul>
          <div className="mt-5 pt-4 border-t border-[color:var(--border)] text-[11px] text-ink-400 leading-relaxed">
            Built as a portfolio piece demonstrating quantitative analysis, financial structuring
            literacy, and full-stack execution.
          </div>
        </div>
      </section>
    </div>
  );
}

function Finding({ accent, title, body }: { accent: string; title: string; body: string }) {
  return (
    <li className="flex gap-3">
      <span
        className="mt-1.5 w-2 h-2 rounded-full shrink-0"
        style={{ background: accent, boxShadow: `0 0 0 3px ${accent}22` }}
      />
      <div>
        <div className="font-semibold text-ink-100">{title}</div>
        <div className="text-ink-300 mt-0.5">{body}</div>
      </div>
    </li>
  );
}

function ListItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <span className="text-accent-400 mt-0.5">›</span>
      <span>{children}</span>
    </li>
  );
}
