"use client";

import { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
  Legend,
  CartesianGrid,
  AreaChart,
  Area,
} from "recharts";
import grid from "@/data/grid.json";
import { ChartContainer } from "@/components/ChartContainer";
import {
  sensitivityGrid,
  DEFAULT_UE,
  fmtPct,
} from "@/lib/calculations";

export default function GridConstraintsPage() {
  const [expansionPct, setExpansionPct] = useState(8);   // % annual grid headroom growth
  const [renewablePct, setRenewablePct] = useState(35);  // % renewable share by 2030
  const [demandPct, setDemandPct]       = useState(38);  // % CAGR DC power demand

  // Recompute supply/demand against sliders.
  // Slider re-scales the JSON baseline series linearly — keeps shape, lets the
  // user explore where supply and demand cross.
  const series = useMemo(() => {
    const base = grid.supplyDemand;
    const baseDemandCAGR = 0.38;
    const baseSupplyCAGR = 0.08;
    return base.map((pt, i) => {
      const yearsFrom25 = pt.year - 2025;
      const demandScale = Math.pow((1 + demandPct / 100) / (1 + baseDemandCAGR), yearsFrom25);
      const supplyScale = Math.pow((1 + expansionPct / 100) / (1 + baseSupplyCAGR), yearsFrom25);
      return {
        year: pt.year,
        dcDemandMW: Math.round(pt.dcDemandMW * demandScale),
        tnbHeadroomMW: Math.round(pt.tnbHeadroomMW * supplyScale),
        renewableMW: Math.round(pt.tnbHeadroomMW * supplyScale * (renewablePct / 100)),
      };
    });
  }, [expansionPct, renewablePct, demandPct]);

  // Find the crossover year where demand exceeds supply (linear interp).
  const crossover = useMemo(() => {
    for (let i = 1; i < series.length; i++) {
      const prev = series[i - 1];
      const cur = series[i];
      const prevDelta = prev.dcDemandMW - prev.tnbHeadroomMW;
      const curDelta = cur.dcDemandMW - cur.tnbHeadroomMW;
      if (prevDelta <= 0 && curDelta > 0) {
        const t = -prevDelta / (curDelta - prevDelta);
        return {
          year: prev.year + t,
          mw: prev.tnbHeadroomMW + t * (cur.tnbHeadroomMW - prev.tnbHeadroomMW),
        };
      }
    }
    return null;
  }, [series]);

  const sens = useMemo(
    () => sensitivityGrid(grid.sensitivity.tariffsMYRperKWh, grid.sensitivity.utilizationPct, DEFAULT_UE),
    [],
  );
  // For heatmap coloring
  const allIRR = sens.flatMap((r) => r.values.map((v) => v.irrPct));
  const minIRR = Math.min(...allIRR);
  const maxIRR = Math.max(...allIRR);
  const irrColor = (v: number) => {
    const t = (v - minIRR) / (maxIRR - minIRR + 1e-9);
    // electric blue → amber → red ramp
    if (v < 0) return "rgba(248, 113, 113, 0.85)";
    if (t < 0.5) {
      const k = t / 0.5;
      return `rgba(${Math.round(245 * k)}, ${Math.round(158 * k + 130 * (1 - k))}, ${Math.round(11 * k + 246 * (1 - k))}, 0.85)`;
    }
    const k = (t - 0.5) / 0.5;
    return `rgba(${Math.round(52 * k + 245 * (1 - k))}, ${Math.round(211 * k + 158 * (1 - k))}, ${Math.round(153 * k + 11 * (1 - k))}, 0.85)`;
  };

  return (
    <div className="space-y-6">
      <header>
        <div className="eyebrow">SECTION</div>
        <h2 className="text-2xl font-semibold tracking-tight mt-1">Grid Constraints</h2>
        <p className="text-[13px] text-ink-300 mt-2 max-w-3xl leading-relaxed">
          Power is the binding constraint, not capital. TNB&apos;s near-term grid headroom is
          finite, and the hyperscaler commitment book already exceeds delivery cadence under
          base-case expansion. Move the sliders to test policy and demand sensitivities.
        </p>
      </header>

      <ChartContainer
        title="Data center power demand vs. TNB supply headroom"
        subtitle="Crossover year highlights the date at which demand exceeds available grid capacity under the chosen assumptions."
        source="Modeled — TNB Energy Outlook baseline + project commitment book (placeholder)"
        methodology="Demand scaled from a 38% CAGR baseline; supply scaled from an 8% CAGR baseline. Renewables show share of total headroom."
      >
        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <ResponsiveContainer width="100%" height={340}>
              <LineChart data={series} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
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
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="tnbHeadroomMW" name="TNB headroom" stroke="#60A5FA" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="dcDemandMW" name="DC demand" stroke="#FBBF24" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="renewableMW" name="Renewable share" stroke="#34D399" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
                {crossover && (
                  <ReferenceDot
                    x={Math.round(crossover.year)}
                    y={crossover.mw}
                    r={6}
                    fill="#F87171"
                    stroke="#fff"
                    label={{ value: `Crossover ${crossover.year.toFixed(1)}`, fill: "#F87171", fontSize: 11, position: "top" }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-4">
            <SliderRow label="Grid expansion (% CAGR)" value={expansionPct} min={2} max={20} step={0.5} onChange={setExpansionPct} suffix="%" />
            <SliderRow label="Renewable share by horizon (%)" value={renewablePct} min={5} max={80} step={1} onChange={setRenewablePct} suffix="%" />
            <SliderRow label="DC demand growth (% CAGR)" value={demandPct} min={10} max={70} step={1} onChange={setDemandPct} suffix="%" />
            <div className="panel-inset p-3 text-[12px]">
              <div className="eyebrow mb-1">CROSSOVER</div>
              {crossover ? (
                <div>
                  <div className="text-bad font-semibold text-base">
                    Year {crossover.year.toFixed(1)}
                  </div>
                  <div className="text-ink-300 mt-1">
                    Demand exceeds available grid headroom at ~{Math.round(crossover.mw).toLocaleString()} MW.
                  </div>
                </div>
              ) : (
                <div className="text-good">No crossover within window — supply leads.</div>
              )}
            </div>
          </div>
        </div>
      </ChartContainer>

      <div className="grid lg:grid-cols-2 gap-6">
        <ChartContainer
          title="Johor water stress proxy"
          subtitle="Reservoir storage trending downward. Hyperscale water-cooled facilities raise per-MW consumption to ~1.8L/kWh."
          source="Johor state water utility (placeholder series)"
        >
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={grid.waterStress}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis domain={[50, 100]} tickFormatter={(v) => `${v}%`} />
              <Tooltip
                contentStyle={{
                  background: "#0B1220",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Area type="monotone" dataKey="johorReservoirPct" stroke="#60A5FA" fill="rgba(96,165,250,0.15)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer
          title="Project IRR sensitivity"
          subtitle={`Reference facility: $${(DEFAULT_UE.capexUSD / 1e9).toFixed(1)}B capex, ${DEFAULT_UE.capacityMW} MW IT load, ${DEFAULT_UE.holdYears}-yr hold. Rows = tariff, cols = utilization.`}
          source="Bottom-up project model — see Methodology"
          methodology="IRR proxy from 10-year annuity NPV. Inputs: $180/kW-mo colo, 1.4 PUE, 24% tax."
        >
          <div className="overflow-x-auto">
            <table className="text-[11px] num">
              <thead>
                <tr>
                  <th className="text-left text-ink-400 px-2 py-1">MYR/kWh ↓ · Util →</th>
                  {grid.sensitivity.utilizationPct.map((u) => (
                    <th key={u} className="text-right text-ink-400 px-2 py-1">{u}%</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sens.map((row) => (
                  <tr key={row.tariff}>
                    <td className="text-ink-200 px-2 py-1">{row.tariff.toFixed(2)}</td>
                    {row.values.map((v) => (
                      <td key={v.util} className="px-2 py-1 text-right" style={{ background: irrColor(v.irrPct), color: "#0B1220", fontWeight: 600 }}>
                        {fmtPct(v.irrPct, 1)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="text-[11px] text-ink-400 mt-3">
            Red = negative IRR · Amber = mid-teens · Green = institutional-grade returns (~20%+)
          </div>
        </ChartContainer>
      </div>
    </div>
  );
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  onChange,
  suffix,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  suffix?: string;
}) {
  return (
    <div>
      <div className="flex justify-between text-[11px] text-ink-300 mb-1">
        <span>{label}</span>
        <span className="num text-ink-100 font-medium">
          {value}
          {suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-accent-500"
      />
    </div>
  );
}
