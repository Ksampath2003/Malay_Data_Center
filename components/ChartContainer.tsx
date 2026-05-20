import clsx from "clsx";

interface Props {
  title: string;
  subtitle?: string;
  source?: string;
  methodology?: string;
  right?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

export function ChartContainer({
  title,
  subtitle,
  source,
  methodology,
  right,
  className,
  children,
}: Props) {
  return (
    <section className={clsx("panel p-5", className)}>
      <header className="flex items-start justify-between gap-4 mb-3">
        <div>
          <h3 className="text-[14px] font-semibold tracking-tight">{title}</h3>
          {subtitle && (
            <p className="text-[12px] text-ink-300 mt-0.5 leading-snug max-w-2xl">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {methodology && (
            <span
              title={methodology}
              className="text-[10px] eyebrow text-ink-400 border border-[color:var(--border)] rounded px-1.5 py-0.5 cursor-help"
            >
              ⓘ METHOD
            </span>
          )}
          {right}
        </div>
      </header>
      <div>{children}</div>
      {source && (
        <div className="mt-3 pt-3 border-t border-[color:var(--border)] text-[10px] eyebrow text-ink-400">
          SOURCE · {source}
        </div>
      )}
    </section>
  );
}
