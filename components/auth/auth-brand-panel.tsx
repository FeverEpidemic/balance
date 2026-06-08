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
        className="auth-brand-panel-bg pointer-events-none absolute inset-0"
        aria-hidden="true"
      />
      <div className="relative">
        <p className="eyebrow text-primary-strong/70">{eyebrow}</p>
        <h1 className="headline-lg mt-4 max-w-xl text-primary-strong">{title}</h1>
        <p className="mt-4 max-w-lg text-sm leading-7 text-primary-strong/72">{subtitle}</p>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {highlights.map((highlight) => (
            <div
              key={highlight.label}
              className="auth-brand-highlight info-tile backdrop-blur-sm"
            >
              <p className="font-label text-[11px] uppercase tracking-[0.14em] text-primary-strong/62">{highlight.label}</p>
              <p className="mt-3 font-display text-lg text-primary-strong">{highlight.value}</p>
            </div>
          ))}
        </div>

        <div className="auth-brand-rhythm mt-8 rounded-2xl p-5 backdrop-blur-sm">
          <p className="font-label text-xs uppercase tracking-[0.16em] text-primary-strong/78">{rhythmTitle}</p>
          <div className="mt-4 grid gap-3">
            {rhythmItems.map((item) => (
              <div
                key={item.label}
                className="auth-brand-rhythm-item flex items-center justify-between gap-3 rounded-xl px-4 py-3"
              >
                <span className="text-sm text-primary-strong/78">{item.label}</span>
                <span className="font-label text-xs uppercase tracking-[0.12em] text-primary-strong">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
