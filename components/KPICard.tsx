import clsx from "clsx";

interface Props {
  label: string;
  value: string;
  delta?: string;          // e.g., "+38% YoY" or "Δ +1.2B"
  deltaTone?: "good" | "warn" | "bad" | "neutral";
  context?: string;        // small descriptive line
  source?: string;
}

export function KPICard({ label, value, delta, deltaTone = "neutral", context, source }: Props) {
  return (
    <div className="panel p-5">
      <div className="eyebrow">{label}</div>
      <div className="mt-2 flex items-baseline gap-3">
        <div className="text-3xl font-semibold tracking-tight num">{value}</div>
        {delta && (
          <span
            className={clsx(
              "text-[11px] font-medium num px-1.5 py-0.5 rounded",
              deltaTone === "good" && "text-good bg-good/10",
              deltaTone === "warn" && "text-warn bg-warn/10",
              deltaTone === "bad" && "text-bad bg-bad/10",
              deltaTone === "neutral" && "text-ink-300 bg-white/[0.04]",
            )}
          >
            {delta}
          </span>
        )}
      </div>
      {context && <div className="mt-2 text-[12px] text-ink-300 leading-snug">{context}</div>}
      {source && <div className="mt-3 text-[10px] eyebrow text-ink-400">SRC · {source}</div>}
    </div>
  );
}
