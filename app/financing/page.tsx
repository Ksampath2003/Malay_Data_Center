"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import financing from "@/data/financing.json";
import operators from "@/data/operators.json";
import financiers from "@/data/financiers.json";
import datacenters from "@/data/datacenters.json";
import { ChartContainer } from "@/components/ChartContainer";
import { DataTable, type Column } from "@/components/DataTable";
import { Sankey } from "@/components/Sankey";
import { fmtUSD_MM, fmtUSD_B } from "@/lib/calculations";
import type { DataCenter, Financier, Investment, Operator } from "@/lib/types";

const SOURCE_COLORS: Record<string, string> = {
  USHyperscaler: "#60A5FA",
  USPrivateEquity: "#FBBF24",
  SovereignWealth: "#34D399",
  AsianConglomerate: "#A78BFA",
  MalaysianState: "#F472B6",
};
const SOURCE_LABEL: Record<string, string> = {
  USHyperscaler: "US Hyperscaler",
  USPrivateEquity: "US Private Equity",
  SovereignWealth: "Sovereign Wealth",
  AsianConglomerate: "Asian Conglomerate",
  MalaysianState: "Malaysian State",
};

interface TableRow {
  projectId: string;
  project: string;
  operator: string;
  capexUSD_MM: number;
  primaryFinancier: string;
  structure: string;
  equityDebt: string;
  announcedDate: string;
  status: string;
}

export default function FinancingPage() {
  const dcs = datacenters as DataCenter[];
  const ops = operators as Operator[];
  const fins = financiers as Financier[];
  const inv = financing.investments as Investment[];

  const opMap = useMemo(
    () => Object.fromEntries(ops.map((o) => [o.id, o])) as Record<string, Operator>,
    [ops],
  );
  const finMap = useMemo(
    () => Object.fromEntries(fins.map((f) => [f.id, f])) as Record<string, Financier>,
    [fins],
  );
  const dcMap = useMemo(
    () => Object.fromEntries(dcs.map((d) => [d.id, d])) as Record<string, DataCenter>,
    [dcs],
  );

  // Build the table rows by joining investments with project + financier metadata.
  // One row per project; if a project has multiple investments, sum the capex but
  // attribute to the largest primary financier — keeps the table scannable.
  const rows: TableRow[] = useMemo(() => {
    const grouped = new Map<string, Investment[]>();
    for (const i of inv) {
      const arr = grouped.get(i.projectId) ?? [];
      arr.push(i);
      grouped.set(i.projectId, arr);
    }
    return Array.from(grouped.entries()).map(([projectId, invs]) => {
      const dc = dcMap[projectId];
      const op = opMap[dc?.operatorId];
      const totalCapex = invs.reduce((s, i) => s + i.amountUSD_MM, 0);
      const largest = invs.reduce((a, b) => (a.amountUSD_MM >= b.amountUSD_MM ? a : b));
      const fin = finMap[largest.financierId];
      return {
        projectId,
        project: dc?.name ?? projectId,
        operator: op?.name ?? "—",
        capexUSD_MM: totalCapex,
        primaryFinancier: fin?.name ?? "—",
        structure: largest.structure,
        equityDebt: `${largest.equityPct}% / ${largest.debtPct}%`,
        announcedDate: largest.announcedDate,
        status: largest.status,
      };
    });
  }, [inv, opMap, finMap, dcMap]);

  const totalCommitted = rows.reduce((s, r) => s + r.capexUSD_MM, 0);

  const columns: Column<TableRow>[] = [
    {
      key: "project",
      header: "Project",
      render: (r) => <span className="font-medium">{r.project}</span>,
    },
    { key: "operator", header: "Operator" },
    {
      key: "capexUSD_MM",
      header: "Capex",
      align: "right",
      render: (r) => fmtUSD_MM(r.capexUSD_MM),
      sortAccessor: (r) => r.capexUSD_MM,
    },
    { key: "primaryFinancier", header: "Primary Financier" },
    { key: "structure", header: "Structure" },
    { key: "equityDebt", header: "E / D", align: "right" },
    { key: "announcedDate", header: "Announced", align: "right" },
    {
      key: "status",
      header: "Status",
      render: (r) => (
        <span className="px-1.5 py-0.5 rounded text-[10px] eyebrow bg-white/[0.04] text-ink-200">
          {r.status}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      <header>
        <div className="eyebrow">SECTION · CENTERPIECE</div>
        <h2 className="text-2xl font-semibold tracking-tight mt-1">Financing</h2>
        <p className="text-[13px] text-ink-300 mt-2 max-w-3xl leading-relaxed">
          Two financing models are coexisting in Malaysia: hyperscaler-direct capex (Microsoft,
          Google, AWS funding 100%-equity from operating cash and corporate debt) and PE-platform
          colocation (Blackstone, GIC, KKR running JV and project-finance structures with
          50–60% project debt). Tracking who provides the equity behind each megawatt is the
          fastest way to understand the geopolitics.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Stat label="Total Committed (Dataset)" value={fmtUSD_B(totalCommitted)} sub={`${rows.length} projects in commitment book`} />
        <Stat label="US Hyperscaler Direct" value={fmtUSD_B(financing.annualBySource.reduce((s, y) => s + (y.USHyperscaler as number), 0))} sub="2020–2025, $B" />
        <Stat label="PE / Infra Fund" value={fmtUSD_B(financing.annualBySource.reduce((s, y) => s + (y.USPrivateEquity as number), 0))} sub="LP capital via Blackstone, GIP, etc." />
      </div>

      <ChartContainer
        title="Annual data center investment by financing source"
        subtitle="2024 inflection driven by Microsoft + Google + Oracle direct commitments alongside the AirTrunk acquisition."
        source="Public announcements + analyst aggregation (placeholder series)"
        methodology="Bucketed by financier category. Annual figures are committed-in-year, not deployed-in-year."
      >
        <ResponsiveContainer width="100%" height={360}>
          <BarChart data={financing.annualBySource} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" />
            <YAxis tickFormatter={(v) => `$${v}B`} width={60} />
            <Tooltip
              contentStyle={{
                background: "#0B1220",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={(v: any, name: string) => [`$${(v as number).toFixed(1)}B`, SOURCE_LABEL[name] ?? name]}
            />
            <Legend
              wrapperStyle={{ fontSize: 11 }}
              formatter={(v: string) => SOURCE_LABEL[v] ?? v}
            />
            {Object.keys(SOURCE_COLORS).map((k) => (
              <Bar key={k} dataKey={k} stackId="a" fill={SOURCE_COLORS[k]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>

      <ChartContainer
        title="Capital flows: Source → Vehicle → Destination"
        subtitle="LP equity, corporate cash, sovereign capital routed through direct ownership, JVs, infra funds, and build-to-suit leases into Malaysian projects."
        source="Investment book aggregation (placeholder)"
        methodology="Link thickness proportional to committed USD. Vehicle bucket separates hyperscaler-direct from PE platform structures."
      >
        <Sankey
          nodes={financing.sankey.nodes as any}
          links={financing.sankey.links as any}
          height={520}
          width={1080}
        />
      </ChartContainer>

      <ChartContainer
        title="Project-level commitment book"
        subtitle="Sortable. Click any column header. Equity/debt mix reflects the primary financier's structure for that project."
        source="Project announcements (placeholder where unverified)"
      >
        <DataTable
          rows={rows}
          columns={columns}
          initialSort={{ key: "capexUSD_MM", dir: "desc" }}
        />
      </ChartContainer>

      <section>
        <div className="eyebrow mb-3">WHO FINANCES THE FINANCIERS</div>
        <h3 className="text-[15px] font-semibold tracking-tight mb-1">
          Where the data center capex actually originates
        </h3>
        <p className="text-[12px] text-ink-300 max-w-3xl mb-5 leading-snug">
          The hyperscalers don&apos;t literally write a check from operating cash — capex of this scale
          requires layered funding. Microsoft and Google lean heavily on internal cash flow; Oracle
          funds its OCI buildout primarily through corporate debt; AWS uses build-to-suit colocation
          to keep capacity off the balance sheet. PE-platform capacity (Blackstone-owned AirTrunk,
          KKR-backed colos) blends LP equity with project-level debt.
        </p>
        <div className="grid lg:grid-cols-2 gap-4">
          {financing.financiersOfFinanciers.map((f) => (
            <div key={f.financier} className="panel p-5">
              <div className="text-[13px] font-semibold">{f.financier}</div>
              <div className="text-[11px] text-ink-400 mt-0.5">CAPEX FUNDING MIX</div>
              <div className="mt-3 space-y-2">
                {f.capexFunding.map((row) => (
                  <div key={row.source}>
                    <div className="flex justify-between text-[12px]">
                      <span className="text-ink-200">{row.source}</span>
                      <span className="num text-ink-100 font-medium">{row.pct}%</span>
                    </div>
                    <div className="h-1.5 bg-white/[0.04] rounded mt-1 overflow-hidden">
                      <div
                        className="h-full bg-accent-500 rounded"
                        style={{ width: `${row.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              {f.note && <div className="mt-4 text-[11px] text-ink-400 leading-snug">{f.note}</div>}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="panel p-4">
      <div className="eyebrow">{label}</div>
      <div className="text-xl font-semibold num mt-1">{value}</div>
      <div className="text-[11px] text-ink-400 mt-1">{sub}</div>
    </div>
  );
}
