export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-overlay px-5 py-8 text-center">
      <p className="eyebrow text-primary-strong/80">Belum ada isi</p>
      <p className="mt-3 font-display text-lg">{title}</p>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  );
}
