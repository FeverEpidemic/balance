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
            "radial-gradient(circle at top left, rgba(232, 223, 184, 0.58), transparent 40%), radial-gradient(circle at 78% 22%, rgba(250, 241, 220, 0.58), transparent 30%), radial-gradient(circle at bottom right, rgba(152, 146, 108, 0.14), transparent 36%), linear-gradient(180deg, rgba(255,251,244,0.9), rgba(246,241,231,0.98))"
        }}
      />
      <div className="relative">
        <p className="eyebrow text-primary-strong/70">{eyebrow}</p>
        <h1 className="headline-lg mt-4 max-w-xl text-primary-strong">{title}</h1>
        <p className="mt-4 max-w-lg text-sm leading-7 text-primary-strong/72">{subtitle}</p>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {highlights.map((highlight) => (
            <div
              key={highlight.label}
              className="info-tile border-[color:rgba(126,117,84,0.14)] bg-[linear-gradient(180deg,rgba(255,252,246,0.84),rgba(247,240,225,0.76))] shadow-[0_18px_36px_-28px_rgba(84,74,45,0.3)] backdrop-blur-sm"
            >
              <p className="font-label text-[11px] uppercase tracking-[0.14em] text-primary-strong/62">{highlight.label}</p>
              <p className="mt-3 font-display text-lg text-primary-strong">{highlight.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-[color:rgba(126,117,84,0.14)] bg-[linear-gradient(180deg,rgba(218,207,170,0.24),rgba(255,250,242,0.72))] p-5 shadow-[0_22px_42px_-32px_rgba(84,74,45,0.34)] backdrop-blur-sm">
          <p className="font-label text-xs uppercase tracking-[0.16em] text-primary-strong/78">{rhythmTitle}</p>
          <div className="mt-4 grid gap-3">
            {rhythmItems.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between gap-3 rounded-xl border border-[color:rgba(126,117,84,0.12)] bg-[color:rgba(255,250,242,0.78)] px-4 py-3"
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
