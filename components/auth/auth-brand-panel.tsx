type AuthBrandPanelProps = {
  eyebrow: string;
  highlights: Array<{
    label: string;
    value: string;
  }>;
  rhythmItems: Array<{
    label: string;
    value: string;
  }>;
  rhythmTitle: string;
  subtitle: string;
  title: string;
};

export function AuthBrandPanel({ eyebrow, highlights, rhythmItems, rhythmTitle, subtitle, title }: AuthBrandPanelProps) {
  return (
    <section className="card relative hidden overflow-hidden lg:block">
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(circle at top left, rgba(224, 231, 187, 0.52), transparent 38%), radial-gradient(circle at bottom right, rgba(113, 120, 84, 0.18), transparent 34%), linear-gradient(180deg, rgba(255,255,255,0.78), rgba(245,244,237,0.96))"
        }}
      />
      <div className="relative">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="headline-lg mt-4 max-w-xl">{title}</h1>
        <p className="mt-4 max-w-lg text-sm leading-7 text-muted-foreground">{subtitle}</p>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {highlights.map((highlight) => (
            <div key={highlight.label} className="glass-panel info-tile">
              <p className="font-label text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{highlight.label}</p>
              <p className="mt-3 font-display text-lg text-primary-strong">{highlight.value}</p>
            </div>
          ))}
        </div>

        <div className="glass-panel mt-8 rounded-2xl p-5">
          <p className="font-label text-xs uppercase tracking-[0.16em] text-primary-strong">{rhythmTitle}</p>
          <div className="mt-4 grid gap-3">
            {rhythmItems.map((item) => (
              <div key={item.label} className="flex items-center justify-between gap-3 rounded-xl bg-muted px-4 py-3">
                <span className="text-sm text-muted-foreground">{item.label}</span>
                <span className="font-label text-xs uppercase tracking-[0.12em] text-primary-strong">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
