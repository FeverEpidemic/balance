"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* ------------------------------------------------------------------ */
/*  Slide data model                                                   */
/* ------------------------------------------------------------------ */

type HeroMockupSlide = {
  id: string;
  render: () => React.ReactNode;
};

/* ------------------------------------------------------------------ */
/*  Slide 1 – Light overview dashboard                                 */
/* ------------------------------------------------------------------ */

function SlideOverview() {
  return (
    <div className="flex h-full flex-col gap-4 p-5 md:p-6" style={{ background: "#fbf9f3", color: "#1b1c18" }}>
      {/* Saldo utama */}
      <div>
        <p className="font-label text-xs uppercase tracking-[0.16em]" style={{ color: "#46483e" }}>
          Saldo Utama
        </p>
        <p className="metric mt-1 text-3xl md:text-[2.2rem]" style={{ color: "#1b1c18" }}>
          Rp12.450.000
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl p-4" style={{ background: "#ffffff", border: "1px solid rgba(89,95,61,0.1)" }}>
          <p className="font-label text-xs uppercase tracking-[0.14em]" style={{ color: "#46483e" }}>
            Pengeluaran Bulan Ini
          </p>
          <p className="metric mt-2 text-xl" style={{ color: "#b45e5e" }}>
            Rp3.200.000
          </p>
        </div>
        <div className="rounded-xl p-4" style={{ background: "#ffffff", border: "1px solid rgba(89,95,61,0.1)" }}>
          <p className="font-label text-xs uppercase tracking-[0.14em]" style={{ color: "#46483e" }}>
            Pemasukan
          </p>
          <p className="metric mt-2 text-xl" style={{ color: "#5b8f62" }}>
            Rp5.100.000
          </p>
        </div>
      </div>

      {/* Budget bar */}
      <div className="mt-auto rounded-xl p-4" style={{ background: "#f5f4ed" }}>
        <div className="flex items-center justify-between">
          <p className="font-label text-xs uppercase tracking-[0.14em]" style={{ color: "#46483e" }}>
            Kebutuhan Pokok
          </p>
          <p className="font-label text-xs" style={{ color: "#595f3d" }}>
            68%
          </p>
        </div>
        <div className="mt-2 h-2.5 rounded-full" style={{ background: "#efeee7" }}>
          <div className="h-2.5 w-[68%] rounded-full" style={{ background: "#595f3d" }} />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Slide 2 – Light transaction / activity view                        */
/* ------------------------------------------------------------------ */

type TxRow = { date: string; category: string; amount: string; isExpense: boolean };

const txRows: TxRow[] = [
  { date: "17 Jun", category: "Makan", amount: "Rp45.000", isExpense: true },
  { date: "17 Jun", category: "Transport", amount: "Rp22.000", isExpense: true },
  { date: "16 Jun", category: "Belanja", amount: "Rp128.500", isExpense: true },
  { date: "16 Jun", category: "Gaji", amount: "Rp4.200.000", isExpense: false },
];

function SlideTransactions() {
  return (
    <div className="flex h-full flex-col gap-3 p-5 md:p-6" style={{ background: "#fbf9f3", color: "#1b1c18" }}>
      <p className="font-label text-xs uppercase tracking-[0.16em]" style={{ color: "#46483e" }}>
        Transaksi Terbaru
      </p>

      <div className="flex flex-col gap-2">
        {txRows.map((tx) => (
          <div
            key={`${tx.date}-${tx.category}-${tx.amount}`}
            className="flex items-center justify-between rounded-xl px-4 py-3"
            style={{ background: "#ffffff", border: "1px solid rgba(89,95,61,0.06)" }}
          >
            <div className="flex items-center gap-3">
              <span className="font-label text-xs" style={{ color: "#46483e" }}>
                {tx.date}
              </span>
              <span
                className="rounded-md px-2.5 py-1 font-label text-[11px]"
                style={{ background: "#efeee7", color: "#46483e" }}
              >
                {tx.category}
              </span>
            </div>
            <span
              className="metric text-sm font-medium"
              style={{ color: tx.isExpense ? "#b45e5e" : "#5b8f62" }}
            >
              {tx.isExpense ? `-${tx.amount}` : `+${tx.amount}`}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-auto rounded-xl px-4 py-3 text-center">
        <span className="font-label text-[11px]" style={{ color: "#595f3d" }}>
          Lihat semua transaksi →
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Slide 3 – Dark overview dashboard (self-contained colours)         */
/* ------------------------------------------------------------------ */

function SlideDarkOverview() {
  return (
    <div
      className="flex h-full flex-col gap-4 p-5 md:p-6"
      style={{
        background:
          "radial-gradient(circle at 82% 16%, rgba(232, 188, 103, 0.16), transparent 26%), radial-gradient(circle at 18% 14%, rgba(194, 211, 166, 0.12), transparent 32%), linear-gradient(180deg, #1e261d 0%, #1a2119 100%)",
        color: "#edf1e6"
      }}
    >
      {/* Saldo utama */}
      <div>
        <p className="font-label text-xs uppercase tracking-[0.16em]" style={{ color: "#d4ddca" }}>
          Saldo Utama
        </p>
        <p className="metric mt-1 text-3xl md:text-[2.2rem]" style={{ color: "#edf1e6" }}>
          Rp12.450.000
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3">
        <div
          className="rounded-xl p-4"
          style={{
            background: "linear-gradient(180deg, rgba(53, 66, 50, 0.98), rgba(45, 56, 44, 0.98))",
            border: "1px solid #4a5c44",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04), 0 14px 28px -24px rgba(0,0,0,0.55)"
          }}
        >
          <p className="font-label text-xs uppercase tracking-[0.14em]" style={{ color: "#d4ddca" }}>
            Pengeluaran Bulan Ini
          </p>
          <p className="metric mt-2 text-xl" style={{ color: "#efb0a7" }}>
            Rp3.200.000
          </p>
        </div>
        <div
          className="rounded-xl p-4"
          style={{
            background: "linear-gradient(180deg, rgba(53, 66, 50, 0.98), rgba(45, 56, 44, 0.98))",
            border: "1px solid #4a5c44",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04), 0 14px 28px -24px rgba(0,0,0,0.55)"
          }}
        >
          <p className="font-label text-xs uppercase tracking-[0.14em]" style={{ color: "#d4ddca" }}>
            Pemasukan
          </p>
          <p className="metric mt-2 text-xl" style={{ color: "#a9d3a2" }}>
            Rp5.100.000
          </p>
        </div>
      </div>

      {/* Budget bar */}
      <div
        className="mt-auto rounded-xl p-4"
        style={{
          background: "linear-gradient(180deg, rgba(45, 56, 44, 0.96), rgba(39, 48, 38, 0.96))",
          border: "1px solid rgba(74, 92, 68, 0.76)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)"
        }}
      >
        <div className="flex items-center justify-between">
          <p className="font-label text-xs uppercase tracking-[0.14em]" style={{ color: "#d4ddca" }}>
            Kebutuhan Pokok
          </p>
          <p className="font-label text-xs" style={{ color: "#e3ca8c" }}>
            68%
          </p>
        </div>
        <div className="mt-2 h-2.5 rounded-full" style={{ background: "#445441" }}>
          <div
            className="h-2.5 w-[68%] rounded-full"
            style={{
              background: "linear-gradient(90deg, #ced8aa 0%, #e3ca8c 100%)",
              boxShadow: "0 0 18px rgba(227, 202, 140, 0.28)"
            }}
          />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Slides list                                                        */
/* ------------------------------------------------------------------ */

const SLIDES: HeroMockupSlide[] = [
  { id: "overview-light", render: () => <SlideOverview /> },
  { id: "transactions", render: () => <SlideTransactions /> },
  { id: "overview-dark", render: () => <SlideDarkOverview /> },
];

const SLIDE_INTERVAL_MS = 7000;

/* ------------------------------------------------------------------ */
/*  Browser-frame mockup with autoplay carousel                        */
/* ------------------------------------------------------------------ */

export function LandingHeroMockup() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [direction, setDirection] = useState<"next" | "prev">("next");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Detect reduced motion preference
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Auto-advance timer
  const startTimer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setDirection("next");
      setCurrentIndex((prev) => (prev + 1) % SLIDES.length);
    }, SLIDE_INTERVAL_MS);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion || isPaused) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }
    startTimer();
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [prefersReducedMotion, isPaused, startTimer]);

  const handleMouseEnter = useCallback(() => setIsPaused(true), []);
  const handleMouseLeave = useCallback(() => setIsPaused(false), []);
  const handleFocus = useCallback(() => setIsPaused(true), []);
  const handleBlur = useCallback(() => setIsPaused(false), []);

  const slideCount = SLIDES.length;

  // Under reduced motion, just show the first slide statically
  if (prefersReducedMotion) {
    return (
      <div aria-hidden="true" className="relative">
        {/* Background glow */}
        <div className="absolute inset-x-8 top-4 h-40 rounded-full bg-primary-soft/60 blur-3xl" />
        <div className="glow-ambient-bg -inset-10 opacity-70" />
        {/* Browser frame */}
        <div
          className="relative overflow-hidden rounded-[1.5rem] border bg-card/90 backdrop-blur-md shadow-float"
          style={{
            boxShadow: "var(--shadow-float), 0 0 0 1px rgba(232, 188, 103, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.15)",
          }}
        >
          {/* Chrome bar */}
          <div className="flex h-9 items-center gap-2 border-b bg-muted/30 px-4">
            <div className="flex gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-green-400/80" />
            </div>
            <div className="mx-auto rounded-full bg-card/65 px-4 py-0.5 border border-border/25">
              <span className="text-[10px] text-muted-foreground font-label">app.balance.id/dashboard</span>
            </div>
          </div>
          {/* Viewport – slide 1 only */}
          <div className="relative min-h-[22rem] overflow-hidden md:min-h-[26rem]">
            {SLIDES[0].render()}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div aria-hidden="true" className="relative group">
      {/* Background glow with transition */}
      <div className="absolute inset-x-8 top-4 h-48 rounded-full bg-primary-soft/60 blur-3xl transition-all duration-500 group-hover:scale-110 group-hover:bg-primary-soft/80" />
      <div className="glow-ambient-bg -inset-12 opacity-80 transition-all duration-500 group-hover:scale-105" />
      
      {/* Browser frame */}
      <div
        ref={containerRef}
        className="relative overflow-hidden rounded-[1.5rem] border bg-card/90 backdrop-blur-md transition-all duration-500 hover:scale-[1.015] hover:border-primary/30"
        style={{
          boxShadow: "var(--shadow-float), 0 0 0 1px rgba(232, 188, 103, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.15)",
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleFocus}
        onBlur={handleBlur}
        tabIndex={0}
        role="presentation"
      >
        {/* Chrome bar */}
        <div className="flex h-9 items-center gap-2 border-b bg-muted/30 px-4">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-green-400/80" />
          </div>
          <div className="mx-auto rounded-full bg-card/65 px-4 py-0.5 border border-border/25">
            <span className="text-[10px] text-muted-foreground font-label">app.balance.id/dashboard</span>
          </div>
        </div>

        {/* Viewport with slide transitions */}
        <div className="relative min-h-[22rem] overflow-hidden md:min-h-[26rem]">
          {SLIDES.map((slide, index) => {
            const isActive = index === currentIndex;
            const isPrev = index === (currentIndex - 1 + slideCount) % slideCount;
            const isNext = index === (currentIndex + 1) % slideCount;

            let positionClass = "opacity-0 scale-95 pointer-events-none";
            if (isActive) {
              positionClass = "opacity-100 translate-x-0 scale-100";
            } else if (direction === "next" && isPrev) {
              positionClass = "opacity-0 -translate-x-6 scale-95 pointer-events-none";
            } else if (direction === "next" && isNext) {
              positionClass = "opacity-0 translate-x-6 scale-95 pointer-events-none";
            } else if (direction === "prev" && isPrev) {
              positionClass = "opacity-0 -translate-x-6 scale-95 pointer-events-none";
            } else if (direction === "prev" && isNext) {
              positionClass = "opacity-0 translate-x-6 scale-95 pointer-events-none";
            }

            return (
              <div
                key={slide.id}
                className={`absolute inset-0 transition-all duration-500 cubic-bezier(0.16, 1, 0.3, 1) ${positionClass}`}
                aria-hidden={!isActive}
              >
                {slide.render()}
              </div>
            );
          })}
        </div>

        {/* Slide indicator dots */}
        <div className="flex items-center justify-center gap-1.5 border-t bg-muted/15 px-4 py-2.5">
          {SLIDES.map((_, index) => (
            <span
              key={index}
              className={`inline-block rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? "h-1.5 w-4 bg-primary"
                  : "h-1.5 w-1.5 bg-muted-foreground/30"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
