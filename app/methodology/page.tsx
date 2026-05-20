export default function MethodologyPage() {
  return (
    <div className="space-y-8 max-w-3xl">
      <header>
        <div className="eyebrow">REFERENCE</div>
        <h2 className="text-2xl font-semibold tracking-tight mt-1">Methodology</h2>
        <p className="text-[13px] text-ink-300 mt-2 leading-relaxed">
          This dashboard analyzes the wave of US hyperscaler investment into Malaysian data center
          infrastructure that began accelerating in 2023. The thesis: structural cost arbitrage,
          power availability relative to Singapore, and AI-driven compute geography are aligning
          to make Johor and Greater KL a top-3 SE Asian compute corridor by 2030.
        </p>
      </header>

      <Section title="Data Sources">
        <ul className="list-disc pl-5 space-y-1.5 text-[13px] text-ink-200">
          <li>Microsoft, Google, AWS, Oracle public investment announcements (2024)</li>
          <li>Cushman &amp; Wakefield Asia Pacific Data Centre Update (capacity baselines)</li>
          <li>Structure Research, BMI / Fitch Solutions (operator-level capacity)</li>
          <li>Malaysian Investment Development Authority (MIDA) press materials</li>
          <li>TNB Energy Outlook &amp; PETRONAS gas-to-power planning documents</li>
          <li>Filings: 10-Ks (Oracle net debt, Microsoft cash flow), Blackstone IR materials</li>
        </ul>
        <p className="text-[12px] text-ink-400 mt-3">
          Records marked <span className="text-amber-400">placeholder</span> in the data files are
          analyst best-estimates pending primary-source confirmation. Records marked{" "}
          <span className="text-good">verified</span> are sourced from published filings or releases.
        </p>
      </Section>

      <Section title="Modeling Assumptions">
        <Item label="Capacity forecast">
          Logistic growth fit f(t) = K / (1 + e<sup>−r·(t−t₀)</sup>), parameters (K, r, t₀) obtained
          by coordinate-descent minimization of squared error on the 2020–2025 live-MW series.
          Confidence band heuristic: ±6%·years-from-last-observation, capped at ±30%. We do not
          have enough observations for a proper prediction interval; the band is meant to
          communicate growing uncertainty, not statistical significance.
        </Item>
        <Item label="Bull / Bear scenarios">
          Bull: K × 1.35, r × 1.20 (faster diffusion, larger market ceiling).
          Bear: K × 0.75, r × 0.85, inflection year shifted +0.5 (grid bottleneck dampens both).
        </Item>
        <Item label="Project unit economics">
          Reference facility: $2.0B capex, 100 MW IT load, $180/kW-month colocation pricing,
          1.4 PUE, 24% Malaysian corporate tax rate, 10-year hold. IRR proxy solved via bisection
          on the annuity NPV equation. Sensitivity grid sweeps tariff (MYR 0.30–0.60/kWh) ×
          utilization (50–95%).
        </Item>
        <Item label="Grid supply/demand">
          DC demand baseline drawn from announced commitment book scaled to 38% CAGR. TNB headroom
          baseline drawn from Energy Outlook reference scenario at ~8% CAGR. Crossover year is the
          linear interpolation of the first year where demand exceeds supply.
        </Item>
        <Item label="Composite risk index">
          Equal-weighted average across six dimensions (cost, power, talent, political, water,
          regulatory), each scored 0–10 where higher is more favorable.
        </Item>
      </Section>

      <Section title="What This Project Demonstrates">
        <ul className="list-disc pl-5 space-y-1.5 text-[13px] text-ink-200">
          <li><strong>Quantitative analysis</strong>: logistic fit, IRR sensitivity, scenario modeling</li>
          <li><strong>Financial structuring literacy</strong>: tracing capital from LP → fund → JV → project</li>
          <li><strong>Geopolitical synthesis</strong>: linking chip export controls, AI diffusion rules, SEZ policy</li>
          <li><strong>Full-stack execution</strong>: Next.js, TypeScript, Recharts, Leaflet, custom math</li>
        </ul>
      </Section>

      <Section title="About">
        <p className="text-[13px] text-ink-200 leading-relaxed">
          Built as a portfolio piece. The author is exploring the intersection of AI infrastructure,
          private capital, and Asian energy policy. Feedback welcome.
        </p>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="text-[14px] font-semibold tracking-tight mb-3 pb-2 border-b border-[color:var(--border)]">
        {title}
      </h3>
      <div>{children}</div>
    </section>
  );
}

function Item({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <div className="text-[12px] font-semibold text-accent-400 mb-1">{label}</div>
      <p className="text-[13px] text-ink-200 leading-relaxed">{children}</p>
    </div>
  );
}
