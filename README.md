# Malaysia AI Infrastructure Intelligence

An institutional-grade analytical dashboard tracking US hyperscaler investment into Malaysian data center infrastructure — the AI buildout concentrated in Johor and Greater Kuala Lumpur.

## The Thesis

In an 18-month window (2023 → mid-2025), Microsoft, Google, AWS, and Oracle committed more than **$16 billion** in announced data center capex to Malaysia. Behind those headlines is a more textured story:

- **Two parallel capital models.** Hyperscaler-direct equity capex (100% operating cash + corporate debt) is coexisting with private-equity-platform colocation (Blackstone post-AirTrunk, KKR, GIC) running JV and project-finance structures.
- **Power is the binding constraint.** Capital is abundant; TNB grid headroom is not. Under the base case modeled here, data center demand crosses available grid capacity around 2028.
- **Geopolitics is the demand engine.** US export controls on advanced compute to China, the proposed AI Diffusion framework, and the Singapore-Johor SEZ all push compute into Malaysia disproportionately.

This dashboard makes that story interactive.

## What's in the dashboard

| Tab | What it shows |
|---|---|
| Overview | Top-line KPIs, capacity forecast 2020–2030, key findings |
| Financing | Stacked-bar by capital source, Sankey of LP → vehicle → project, project-level table, "who finances the financiers" breakdown of hyperscaler/PE capex stacks |
| Map | Leaflet map of Johor + KL with status/country/MW filters, capacity-scaled markers, click-to-inspect popups |
| Capacity | Logistic-fit forecast with bull/base/bear scenarios, time-aligned overlay against the Northern Virginia buildout |
| Grid Constraints | Live supply/demand model with sliders for grid expansion, renewable share, demand growth. Crossover-year highlighted. Project IRR sensitivity heatmap |
| Risk & Comparison | Radar across cost / power / talent / political / water / regulatory vs. Singapore, Vietnam, Indonesia; composite index; three scenario cards |
| Companies | Capex × capacity × jobs bubble chart, country-filterable, drill-down to project book |
| Timeline | Filterable event timeline 2022–2026 |
| Methodology | Modeling assumptions, sources, formulas |

## What the analysis actually does

The numbers aren't faked. `lib/calculations.ts` contains:

- **Logistic curve fit** `f(t) = K / (1 + e^(-r(t-t₀)))` solved by coordinate-descent SSE minimization on the 6-point Malaysia capacity series. Scenarios perturb (K, r, t₀) systematically (bull: K×1.35, r×1.20; bear: K×0.75, r×0.85, t₀+0.5).
- **Project unit economics** for a $2B / 100 MW reference facility. Computes revenue from colocation pricing × utilization × capacity, costs from electricity (tariff × PUE × hours × MYR/USD) + fixed opex, depreciation tax shield, then solves IRR via bisection on the annuity-NPV equation.
- **Sensitivity grid** sweeps tariff (MYR 0.30–0.60/kWh) × utilization (50–95%) and shades the 2-D IRR heatmap accordingly.
- **Grid crossover model** scales the demand/supply baseline against user-set CAGRs and linearly interpolates the first year where demand exceeds supply.

## Stack

- **Next.js 14** App Router + **TypeScript**
- **Tailwind CSS** with a custom institutional palette (deep navy, electric blue, amber)
- **Recharts** for standard chart primitives; custom SVG Sankey to avoid an extra dependency
- **Leaflet** + **React-Leaflet** with CARTO dark basemap tiles (no API key needed)
- Static JSON dataset in `/data` — every row tagged `"source": "verified" | "placeholder"`

No backend. Vercel-deployable as-is.

## Running locally

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## Project structure

```
app/                  # Next.js App Router pages
  layout.tsx          # sidebar + topbar shell
  page.tsx            # Overview
  financing/          # the centerpiece tab
  map/                # Leaflet wrapper
  capacity/           # logistic forecast
  grid-constraints/   # interactive sensitivity
  risk-comparison/    # radar + scenarios
  companies/          # bubble chart
  timeline/           # event log
  methodology/        # how the math works
components/
  Sidebar.tsx, TopBar.tsx, ThemeProvider.tsx
  KPICard.tsx, ChartContainer.tsx, DataTable.tsx
  Sankey.tsx          # custom 3-column SVG Sankey
  MapView.tsx         # client-only Leaflet wrapper
data/
  datacenters.json, operators.json, financiers.json
  capacity.json, financing.json, timeline.json
  risk.json, grid.json
lib/
  types.ts            # domain models (DataCenter, Investment, Financier...)
  calculations.ts     # forecasting + unit economics + formatters
```

## Data provenance

Records tagged `"source": "verified"` come from public announcements, filings, or published industry reports. Records tagged `"source": "placeholder"` are analyst best-estimates structured to demonstrate the model — they are *plausible* and *internally consistent*, but should be confirmed against primary sources before being acted on. The methodology tab makes this distinction visible in the UI.

Real anchor figures used to shape the placeholder distribution:

- Microsoft: $2.2B (announced May 2024) — three hyperscale clusters across Greater KL + Johor
- Google: ~$2B (announced May 2024) — Elmina, Selangor anchor
- AWS: $6B Malaysia commitment by 2038
- Oracle: ~$6.5B commitment
- Johor capacity baseline: 487 MW live · 324 MW under construction · 1.4 GW committed · 3.4 GW early stage
- 40+ operational or under-construction Johor data centers

## License

Built as a portfolio project; code is yours to learn from. Data assumptions are illustrative — verify before relying.
