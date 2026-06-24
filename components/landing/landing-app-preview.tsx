"use client";

/* ------------------------------------------------------------------ */
/*  App Preview Section — 3 CSS-mockup browser cards                   */
/*  Static (no carousel), auto-adapts to theme via CSS vars.           */
/* ------------------------------------------------------------------ */

function DashboardMini() {
  return (
    <div className="flex flex-col gap-3 p-4" style={{ background: "var(--background)", color: "var(--foreground)" }}>
      <div>
        <p className="font-label text-[9px] uppercase tracking-[0.16em] text-muted-foreground">Saldo Utama</p>
        <p className="metric mt-1 text-xl">Rp12.450.000</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-border/40 bg-card p-2.5">
          <p className="font-label text-[8px] uppercase tracking-[0.12em] text-muted-foreground">Pengeluaran</p>
          <p className="metric mt-1 text-sm text-danger">Rp3.200.000</p>
        </div>
        <div className="rounded-lg border border-border/40 bg-card p-2.5">
          <p className="font-label text-[8px] uppercase tracking-[0.12em] text-muted-foreground">Pemasukan</p>
          <p className="metric mt-1 text-sm text-success">Rp5.100.000</p>
        </div>
      </div>
      <div className="rounded-lg bg-muted p-2.5">
        <div className="flex justify-between">
          <p className="font-label text-[8px] uppercase tracking-[0.12em] text-muted-foreground">Kebutuhan Pokok</p>
          <p className="font-label text-[8px] text-primary">68%</p>
        </div>
        <div className="mt-1.5 h-1.5 rounded-full bg-card">
          <div className="h-1.5 w-[68%] rounded-full bg-primary" />
        </div>
      </div>
    </div>
  );
}

function TransactionsMini() {
  const txRows = [
    { date: "17 Jun", cat: "Makan", amount: "Rp45.000", exp: true },
    { date: "17 Jun", cat: "Transport", amount: "Rp22.000", exp: true },
    { date: "16 Jun", cat: "Gaji", amount: "Rp4.200.000", exp: false },
  ];
  return (
    <div className="flex flex-col gap-2 p-4" style={{ background: "var(--background)", color: "var(--foreground)" }}>
      {txRows.map((tx) => (
        <div key={`${tx.date}-${tx.cat}`} className="flex items-center justify-between rounded-lg border border-border/30 bg-card px-3 py-2">
          <div className="flex items-center gap-2">
            <span className="font-label text-[9px] text-muted-foreground">{tx.date}</span>
            <span className="rounded bg-muted px-1.5 py-0.5 font-label text-[8px]">{tx.cat}</span>
          </div>
          <span className={`metric text-xs ${tx.exp ? "text-danger" : "text-success"}`}>
            {tx.exp ? `-${tx.amount}` : `+${tx.amount}`}
          </span>
        </div>
      ))}
    </div>
  );
}

function AiChatMini() {
  return (
    <div className="flex flex-col gap-2.5 p-4" style={{ background: "var(--background)", color: "var(--foreground)" }}>
      <div className="rounded-xl bg-muted px-3 py-2.5">
        <p className="font-label text-[9px] text-muted-foreground">Kamu</p>
        <p className="mt-1 text-xs">Rekap pengeluaran minggu ini</p>
      </div>
      <div className="rounded-xl border border-primary/20 bg-primary-soft/40 px-3 py-2.5">
        <p className="font-label text-[9px] text-primary">AI</p>
        <p className="mt-1 text-xs">Minggu ini total Rp850rb — makan Rp320rb (38%), transport Rp180rb (21%)...</p>
      </div>
      <div className="rounded-xl bg-muted px-3 py-2.5">
        <p className="font-label text-[9px] text-muted-foreground">Kamu</p>
        <p className="mt-1 text-xs">Catat kopi 35rb pagi ini</p>
      </div>
    </div>
  );
}

export function LandingAppPreview() {
  return (
    <div className="grid gap-5 md:grid-cols-3" aria-hidden="true">
      {/* Dashboard preview */}
      <div className="relative overflow-hidden rounded-[1.25rem] border bg-card shadow-serene transition hover:scale-[1.02] hover:shadow-float">
        <div className="flex h-8 items-center gap-2 border-b bg-muted/30 px-3">
          <div className="flex gap-1">
            <span className="h-2 w-2 rounded-full bg-red-400/70" />
            <span className="h-2 w-2 rounded-full bg-amber-400/70" />
            <span className="h-2 w-2 rounded-full bg-green-400/70" />
          </div>
        </div>
        <DashboardMini />
        <div className="border-t bg-muted/10 px-3 py-2 text-center">
          <span className="font-label text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Dashboard</span>
        </div>
      </div>

      {/* Transactions preview */}
      <div className="relative overflow-hidden rounded-[1.25rem] border bg-card shadow-serene transition hover:scale-[1.02] hover:shadow-float">
        <div className="flex h-8 items-center gap-2 border-b bg-muted/30 px-3">
          <div className="flex gap-1">
            <span className="h-2 w-2 rounded-full bg-red-400/70" />
            <span className="h-2 w-2 rounded-full bg-amber-400/70" />
            <span className="h-2 w-2 rounded-full bg-green-400/70" />
          </div>
        </div>
        <TransactionsMini />
        <div className="border-t bg-muted/10 px-3 py-2 text-center">
          <span className="font-label text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Transaksi</span>
        </div>
      </div>

      {/* AI Chat preview */}
      <div className="relative overflow-hidden rounded-[1.25rem] border bg-card shadow-serene transition hover:scale-[1.02] hover:shadow-float">
        <div className="flex h-8 items-center gap-2 border-b bg-muted/30 px-3">
          <div className="flex gap-1">
            <span className="h-2 w-2 rounded-full bg-red-400/70" />
            <span className="h-2 w-2 rounded-full bg-amber-400/70" />
            <span className="h-2 w-2 rounded-full bg-green-400/70" />
          </div>
        </div>
        <AiChatMini />
        <div className="border-t bg-muted/10 px-3 py-2 text-center">
          <span className="font-label text-[10px] uppercase tracking-[0.12em] text-muted-foreground">AI Chat</span>
        </div>
      </div>
    </div>
  );
}
