// Forecasting & sensitivity math for the Malaysia data center dashboard.
//
// Two models live here:
//   1. Logistic growth fit for installed capacity (MW), with three scenarios.
//   2. Project-level unit economics for the sensitivity heatmap.
//
// Both are exposed as pure functions returning typed arrays so chart components
// can be dumb. No external deps — Levenberg–Marquardt is overkill for a 6-point
// historical series, so we use a coordinate-descent grid + golden-section
// refinement to fit K, r, t0.

import type { CapacityPoint } from "./types";

export type Scenario = "base" | "bull" | "bear";

export interface LogisticParams {
  K: number;   // carrying capacity (MW)
  r: number;   // intrinsic growth rate (per year)
  t0: number;  // inflection year
}

export interface CapacityForecastPoint {
  year: number;
  actual?: number;       // observed live MW
  fit?: number;          // model fit through history
  forecast?: number;     // model projection beyond history
  lower?: number;        // 1σ-ish lower confidence band
  upper?: number;        // 1σ-ish upper confidence band
}

/** Logistic curve f(t) = K / (1 + e^(-r * (t - t0))). */
export function logistic(t: number, p: LogisticParams): number {
  return p.K / (1 + Math.exp(-p.r * (t - p.t0)));
}

/** Sum of squared errors of a logistic fit against (year, MW) pairs. */
function sse(series: { year: number; liveMW: number }[], p: LogisticParams): number {
  let s = 0;
  for (const pt of series) {
    const d = logistic(pt.year, p) - pt.liveMW;
    s += d * d;
  }
  return s;
}

/**
 * Fit a logistic curve to (year, liveMW) data. Coordinate-descent over
 * (K, r, t0) with shrinking step sizes. Good enough for monotonically
 * increasing capacity series with ~5–15 points.
 */
export function fitLogistic(
  series: { year: number; liveMW: number }[],
  init?: Partial<LogisticParams>,
): LogisticParams {
  const last = series[series.length - 1].liveMW;
  let p: LogisticParams = {
    K: init?.K ?? Math.max(last * 8, 4000),
    r: init?.r ?? 0.5,
    t0: init?.t0 ?? series[Math.floor(series.length / 2)].year + 2,
  };

  const ranges = {
    K: { min: last * 1.5, max: last * 25, step: last * 0.5 },
    r: { min: 0.1, max: 1.5, step: 0.05 },
    t0: { min: series[0].year, max: series[series.length - 1].year + 8, step: 0.5 },
  };

  // Three coarse-to-fine passes over each parameter.
  for (let pass = 0; pass < 3; pass++) {
    for (const key of ["K", "r", "t0"] as const) {
      const range = ranges[key];
      let best = p[key];
      let bestErr = sse(series, p);
      for (let v = range.min; v <= range.max; v += range.step) {
        const trial = { ...p, [key]: v };
        const err = sse(series, trial);
        if (err < bestErr) {
          bestErr = err;
          best = v;
        }
      }
      p = { ...p, [key]: best };
      range.step /= 4; // refine on next pass
    }
  }
  return p;
}

/**
 * Build forecast points across [startYear, endYear] given fitted base params.
 * Scenarios shift K and r:
 *   - bull: +35% K, +20% r  (faster diffusion, larger ceiling)
 *   - bear: -25% K, -15% r  (grid bottleneck dampens both)
 * Confidence band widens with projection distance (heuristic, not statistical
 * — we don't have enough observations for a proper prediction interval, and
 * the methodology page says so out loud).
 */
export function buildForecast(
  history: CapacityPoint[],
  endYear: number,
  scenario: Scenario,
): { params: LogisticParams; series: CapacityForecastPoint[] } {
  const fitInput = history.map((h) => ({ year: h.year, liveMW: h.liveMW }));
  const base = fitLogistic(fitInput);

  const scaled: LogisticParams =
    scenario === "bull"
      ? { K: base.K * 1.35, r: base.r * 1.20, t0: base.t0 }
      : scenario === "bear"
      ? { K: base.K * 0.75, r: base.r * 0.85, t0: base.t0 + 0.5 }
      : base;

  const lastHistYear = history[history.length - 1].year;
  const out: CapacityForecastPoint[] = [];

  for (let y = history[0].year; y <= endYear; y++) {
    const hist = history.find((h) => h.year === y);
    const model = logistic(y, scaled);
    const isForecast = y > lastHistYear;
    const yearsOut = Math.max(0, y - lastHistYear);
    // ~6% per projection-year heuristic band, capped at 30%
    const bandPct = Math.min(0.3, 0.06 * yearsOut);
    out.push({
      year: y,
      actual: hist?.liveMW,
      fit: !isForecast ? model : undefined,
      forecast: isForecast ? model : undefined,
      lower: isForecast ? model * (1 - bandPct) : undefined,
      upper: isForecast ? model * (1 + bandPct) : undefined,
    });
  }
  return { params: scaled, series: out };
}

// ---------------------------------------------------------------------------
// Project unit economics for the sensitivity heatmap.
//
// Representative facility: $2B capex, 100 MW IT load.
// Revenue model: $/kW-month colocation + utilization rate.
// Cost stack: electricity at MYR/kWh (converted), staff, M&E maintenance.
// Output: post-tax IRR proxy over a 10-year hold.
// ---------------------------------------------------------------------------

export interface UnitEconomicsInputs {
  capexUSD: number;             // total capex
  capacityMW: number;           // critical IT load
  pricePerKwMonthUSD: number;   // colo rack price (per kW critical, per month)
  utilizationPct: number;       // % of critical capacity sold
  tariffMYRperKWh: number;      // grid power tariff
  myrPerUSD: number;            // FX
  pue: number;                  // power usage effectiveness
  opexFixedUSD_MM_pa: number;   // staff + maintenance per year
  holdYears: number;
  taxRatePct: number;
}

export const DEFAULT_UE: UnitEconomicsInputs = {
  capexUSD: 2_000_000_000,
  capacityMW: 100,
  pricePerKwMonthUSD: 180, // top-tier hyperscale colo pricing
  utilizationPct: 85,
  tariffMYRperKWh: 0.45,
  myrPerUSD: 4.7,
  pue: 1.4,
  opexFixedUSD_MM_pa: 28,
  holdYears: 10,
  taxRatePct: 24,
};

/** Project IRR proxy (CAGR of NPV-positive cash flow). Returns percentage. */
export function projectIRR(inp: UnitEconomicsInputs): number {
  const ITkW = inp.capacityMW * 1000;
  const soldKW = ITkW * (inp.utilizationPct / 100);

  // Revenue
  const revenueUSD = soldKW * inp.pricePerKwMonthUSD * 12;

  // Electricity: total facility kWh = IT kWh * PUE
  const kWhPerYear = ITkW * (inp.utilizationPct / 100) * 24 * 365 * inp.pue;
  const elecMYR = kWhPerYear * inp.tariffMYRperKWh;
  const elecUSD = elecMYR / inp.myrPerUSD;

  const opexUSD = elecUSD + inp.opexFixedUSD_MM_pa * 1_000_000;
  const ebitda = revenueUSD - opexUSD;

  // Depreciate capex straight-line over hold for tax purposes
  const depreciation = inp.capexUSD / inp.holdYears;
  const ebt = ebitda - depreciation;
  const tax = Math.max(0, ebt * (inp.taxRatePct / 100));
  const fcf = ebitda - tax;

  // Naive IRR proxy: solve for r such that (fcf annuity factor) ~= capex.
  // Closed form for an annuity isn't exposed; bisection in [-30%, 40%].
  let lo = -0.3;
  let hi = 0.4;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    const npv = annuityNPV(fcf, mid, inp.holdYears) - inp.capexUSD;
    if (npv > 0) lo = mid;
    else hi = mid;
  }
  return ((lo + hi) / 2) * 100;
}

function annuityNPV(pmt: number, rate: number, n: number): number {
  if (Math.abs(rate) < 1e-9) return pmt * n;
  return (pmt * (1 - Math.pow(1 + rate, -n))) / rate;
}

/** 2-D sensitivity grid keyed by tariff (rows) and utilization (cols). */
export function sensitivityGrid(
  tariffs: number[],
  utilizations: number[],
  base: UnitEconomicsInputs = DEFAULT_UE,
): { tariff: number; values: { util: number; irrPct: number }[] }[] {
  return tariffs.map((tariff) => ({
    tariff,
    values: utilizations.map((util) => ({
      util,
      irrPct: projectIRR({ ...base, tariffMYRperKWh: tariff, utilizationPct: util }),
    })),
  }));
}

// ---------------------------------------------------------------------------
// Formatting helpers — colocated so every chart renders units the same way.
// ---------------------------------------------------------------------------

export const fmtUSD_B = (n: number) =>
  `$${(n / 1000).toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}B`;

export const fmtUSD_MM = (n: number) =>
  `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}M`;

export const fmtMW = (n: number) =>
  `${n.toLocaleString("en-US", { maximumFractionDigits: 0 })} MW`;

export const fmtPct = (n: number, dp = 1) =>
  `${n.toFixed(dp)}%`;

export const fmtInt = (n: number) => n.toLocaleString("en-US");
