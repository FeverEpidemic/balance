export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl bg-muted px-5 py-8 text-center">
      <p className="font-display text-lg">{title}</p>
      <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
