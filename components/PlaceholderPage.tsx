interface Props {
  title: string;
  description: string;
  comingSoon?: string[];
}

export function PlaceholderPage({ title, description, comingSoon = [] }: Props) {
  return (
    <div className="space-y-6">
      <header>
        <div className="eyebrow">SECTION</div>
        <h2 className="text-2xl font-semibold tracking-tight mt-1">{title}</h2>
        <p className="text-[13px] text-ink-300 mt-2 max-w-3xl leading-relaxed">{description}</p>
      </header>

      <div className="panel p-10 text-center">
        <div className="mx-auto w-12 h-12 rounded-full border border-dashed border-ink-500 flex items-center justify-center text-ink-400 mb-4">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
          </svg>
        </div>
        <div className="text-[14px] font-medium">Coming soon — data integration in progress</div>
        <div className="text-[12px] text-ink-400 mt-1">
          This section is part of the dashboard scaffold. Charts &amp; analysis below.
        </div>
        {comingSoon.length > 0 && (
          <ul className="mt-5 inline-block text-left text-[12px] text-ink-200 space-y-1.5">
            {comingSoon.map((c) => (
              <li key={c} className="flex items-start gap-2">
                <span className="text-accent-400 mt-0.5">›</span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
