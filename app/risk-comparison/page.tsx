"use client";

import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import risk from "@/data/risk.json";
import { ChartContainer } from "@/components/ChartContainer";

const COLORS: Record<string, string> = {
  Malaysia: "#60A5FA",
  Singapore: "#34D399",
  Vietnam: "#FBBF24",
  Indonesia: "#F87171",
};

const DIMS = [
  { key: "cost", label: "Cost" },
  { key: "power", label: "Power Availability" },
  { key: "talent", label: "Talent" },
  { key: "political", label: "Political Risk" },
  { key: "water", label: "Water Stress" },
  { key: "regulatory", label: "Regulatory Clarity" },
] as const;

export default function RiskComparisonPage() {
  // Pivot the radar source data into one row per dimension.
  const radarData = DIMS.map((d) => {
    const row: Record<string, number | string> = { dim: d.label };
    risk.radar.forEach((c) => (row[c.country] = (c as any)[d.key]));
    return row;
  });

  return (
    <div className="space-y-6">
      <header>
        <div className="eyebrow">SECTION</div>
        <h2 className="text-2xl font-semibold tracking-tight mt-1">Risk &amp; Comparison</h2>
        <p className="text-[13px] text-ink-300 mt-2 max-w-3xl leading-relaxed">
          Malaysia&apos;s competitive position rests on cost arbitrage relative to Singapore and a
          regulatory environment more predictable than Vietnam or Indonesia. Power and water remain
          the binding risk factors.
        </p>
      </header>

      <div className="grid lg:grid-cols-2 gap-6">
        <ChartContainer
          title="SEA data center hub comparison"
          subtitle="Higher score is more favorable (cost = cheaper, water = less stress)."
          source="Composite — World Bank Governance, IEA, BMI Research (placeholder)"
        >
          <ResponsiveContainer width="100%" height={360}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(132,151,184,0.2)" />
              <PolarAngleAxis dataKey="dim" tick={{ fill: "#8497B8", fontSize: 11 }} />
              <PolarRadiusAxis domain={[0, 10]} tick={{ fill: "#56688B", fontSize: 10 }} />
              {risk.radar.map((c) => (
                <Radar
                  key={c.country}
                  name={c.country}
                  dataKey={c.country}
                  stroke={COLORS[c.country]}
                  fill={COLORS[c.country]}
                  fillOpacity={0.12}
                  strokeWidth={1.8}
                />
              ))}
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  background: "#0B1220",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer
          title="Composite attractiveness index"
          subtitle="Weighted average across the six risk dimensions. Malaysia crossed above Singapore in 2024."
          source="Derived (this project)"
        >
          <ResponsiveContainer width="100%" height={360}>
            <LineChart data={risk.compositeIndex}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis domain={[4, 8]} />
              <Tooltip
                contentStyle={{
                  background: "#0B1220",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {Object.keys(COLORS).map((c) => (
                <Line key={c} type="monotone" dataKey={c} stroke={COLORS[c]} strokeWidth={2} dot={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      <section>
        <div className="eyebrow mb-3">SCENARIOS</div>
        <div className="grid md:grid-cols-3 gap-4">
          {risk.scenarios.map((s) => (
            <div key={s.name} className="panel p-5">
              <div className="text-[13px] font-semibold">{s.name}</div>
              <div className="text-[12px] text-ink-300 mt-2 leading-snug">{s.summary}</div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-[12px]">
                <div>
                  <div className="eyebrow">CAPACITY 2030</div>
                  <div className="num text-lg font-semibold mt-0.5">{s.capacityMW_2030.toLocaleString()} MW</div>
                </div>
                <div>
                  <div className="eyebrow">INVESTMENT</div>
                  <div className="num text-lg font-semibold mt-0.5">${s.investmentUSD_B_2030}B</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
