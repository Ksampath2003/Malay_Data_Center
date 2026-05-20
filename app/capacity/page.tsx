"use client";

import { useMemo, useState } from "react";
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
  LineChart,
} from "recharts";
import capacity from "@/data/capacity.json";
import { ChartContainer } from "@/components/ChartContainer";
import { buildForecast, type Scenario } from "@/lib/calculations";
import type { CapacityPoint } from "@/lib/types";

const SCENARIO_COLOR: Record<Scenario, string> = {
  base: "#FBBF24",
  bull: "#34D399",
  bear: "#F87171",
};
const SCENARIO_LABEL: Record<Scenario, string> = {
  base: "Base",
  bull: "Bull",
  bear: "Bear",
};

export default function CapacityPage() {
  const [scenario, setScenario] = useState<Scenario>("base");

  const { series, params } = useMemo(
    () => buildForecast(capacity.historical as CapacityPoint[], 2030, scenario),
    [scenario],
  );

  // Compare against Northern Virginia trajectory, shifted so MY-2020 aligns
  // with NoVA's equivalent absolute-MW year. Lets us answer "what year of
  // NoVA's buildout are we replaying?"
  const novaShift = useMemo(() => {
    const myStart = (capacity.historical[0] as CapacityPoint).liveMW;
    const novaMatch = capacity.northernVirginiaBenchmark.find((n) => n.liveMW >= myStart) ?? capacity.northernVirginiaBenchmark[0];
    const shiftYears = (capacity.historical[0] as CapacityPoint).year - novaMatch.year;
    return capacity.northernVirginiaBenchmark.map((n) => ({
      year: n.year + shiftYears,
      novaMW: n.liveMW,
    }));
  }, []);

  const merged = useMemo(() => {
    const map = new Map<number, any>();
    series.forEach((s) => map.set(s.year, { ...s }));
    novaShift.forEach((n) => {
      const ex = map.get(n.year) ?? { year: n.year };
      ex.novaMW = n.novaMW;
      map.set(n.year, ex);
    });
    return Array.from(map.values()).sort((a, b) => a.year - b.year);
  }, [series, novaShift]);

  return (
    <div className="space-y-6">
      <header>
        <div className="eyebrow">SECTION</div>
        <h2 className="text-2xl font-semibold tracking-tight mt-1">Capacity &amp; Forecasting</h2>
        <p className="text-[13px] text-ink-300 mt-2 max-w-3xl leading-relaxed">
          A logistic-growth fit on the 2020–2025 capacity series. Three scenarios bracket the
          plausible 2030 outcome. The overlay benchmarks Malaysia&apos;s curve against Northern
          Virginia — the prior decade&apos;s mega-buildout — time-aligned to the same starting MW.
        </p>
      </header>

      <div className="flex items-center gap-2">
        <div className="eyebrow mr-2">SCENARIO</div>
        {(Object.keys(SCENARIO_LABEL) as Scenario[]).map((s) => (
          <button
            key={s}
            onClick={() => setScenario(s)}
            className={`px-3 py-1 text-[12px] eyebrow rounded border ${
              scenario === s
                ? "border-accent-500 bg-white/[0.06] text-ink-100"
                : "border-[color:var(--border)] text-ink-300 hover:text-ink-100"
            }`}
            style={scenario === s ? { color: SCENARIO_COLOR[s] } : undefined}
          >
            {SCENARIO_LABEL[s]}
          </button>
        ))}
        <div className="ml-auto text-[11px] text-ink-400 num">
          K = {params.K.toFixed(0)} MW · r = {params.r.toFixed(2)} · t₀ = {params.t0.toFixed(1)}
        </div>
      </div>

      <ChartContainer
        title="Live capacity buildout: actual, model fit, forecast"
        subtitle="Shaded band shows ±6%/year heuristic uncertainty (capped at ±30%). Solid blue = observed. Dashed amber = scenario forecast. Light dashed grey = NoVA comparable, time-aligned."
        source="Cushman & Wakefield + announcements + model"
        methodology="Logistic curve fit by coordinate descent on (K, r, t₀). Scenario perturbations: bull K×1.35 r×1.20; bear K×0.75 r×0.85 t₀+0.5."
      >
        <ResponsiveContainer width="100%" height={440}>
          <ComposedChart data={merged} margin={{ top: 8, right: 24, bottom: 8, left: 0 }}>
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
            <Area type="monotone" dataKey="upper" stroke="none" fill="rgba(96,165,250,0.10)" isAnimationActive={false} legendType="none" />
            <Area type="monotone" dataKey="lower" stroke="none" fill="var(--bg)" isAnimationActive={false} legendType="none" />
            <Line type="monotone" dataKey="actual" stroke="#60A5FA" strokeWidth={2.5} name="Malaysia live MW" dot={{ r: 3 }} />
            <Line type="monotone" dataKey="fit" stroke="#60A5FA" strokeWidth={1.4} strokeDasharray="4 3" name="Model fit" dot={false} />
            <Line type="monotone" dataKey="forecast" stroke={SCENARIO_COLOR[scenario]} strokeWidth={2.5} strokeDasharray="6 4" name={`Forecast (${SCENARIO_LABEL[scenario]})`} dot={false} />
            <Line type="monotone" dataKey="novaMW" stroke="rgba(132,151,184,0.6)" strokeWidth={1.2} strokeDasharray="2 4" name="Northern Virginia (time-aligned)" dot={false} />
            <ReferenceLine x={2025} stroke="rgba(132,151,184,0.4)" strokeDasharray="2 2" label={{ value: "Today", fill: "#8497B8", fontSize: 10 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </ChartContainer>

      <div className="grid lg:grid-cols-3 gap-4">
        {(Object.keys(SCENARIO_LABEL) as Scenario[]).map((s) => {
          const { series: sSeries, params: sParams } = buildForecast(
            capacity.historical as CapacityPoint[],
            2030,
            s,
          );
          const v2030 = Math.round(sSeries.find((x) => x.year === 2030)?.forecast ?? 0);
          return (
            <div key={s} className="panel p-5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: SCENARIO_COLOR[s] }} />
                <div className="text-[13px] font-semibold">{SCENARIO_LABEL[s]} case</div>
              </div>
              <div className="mt-3 text-3xl font-semibold num">{v2030.toLocaleString()} MW</div>
              <div className="text-[11px] eyebrow text-ink-400 mt-1">PROJECTED 2030 LIVE</div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-[11px] text-ink-300">
                <KV label="K" value={sParams.K.toFixed(0)} />
                <KV label="r" value={sParams.r.toFixed(2)} />
                <KV label="t₀" value={sParams.t0.toFixed(1)} />
              </div>
            </div>
          );
        })}
      </div>
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
