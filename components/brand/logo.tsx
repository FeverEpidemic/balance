"use client";

import { useLocale } from "@/components/providers/locale-provider";
import { getTranslator } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface LogoProps {
  variant?: "wordmark" | "icon" | "bmark";
  className?: string;
}

/**
 * Balance logo — inline SVG that adapts to light/dark theme
 * using CSS custom properties from the app's theme system.
 *
 * Usage:
 *   <Logo variant="wordmark" className="h-9 w-auto" />
 *   <Logo variant="icon" className="h-10 w-10" />
 *   <Logo variant="bmark" className="h-10 w-10" />
 */
export function Logo({ variant = "wordmark", className }: LogoProps) {
  const locale = useLocale();
  const t = getTranslator(locale);
  const tagline = t("app.tagline");

  return (
    <span className={cn("inline-flex items-center", className)}>
      {variant === "wordmark" ? (
        <WordmarkLogo tagline={tagline} />
      ) : variant === "bmark" ? (
        <BMarkLogo />
      ) : (
        <IconLogo />
      )}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Balanced-icon: two figures forming a heart + wallet               */
/* ------------------------------------------------------------------ */

function IconLogo() {
  return (
    <svg
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-full w-full"
      role="img"
      aria-label="Balance logo"
    >
      <defs>
        <linearGradient id="leftFigGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a3c4ad" />
          <stop offset="100%" stopColor="#7ba387" />
        </linearGradient>
        <linearGradient id="rightFigGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a5c4d4" />
          <stop offset="100%" stopColor="#7da2b8" />
        </linearGradient>
        <linearGradient id="walletGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8cb296" />
          <stop offset="100%" stopColor="#7298af" />
        </linearGradient>
      </defs>

      {/* Background — uses theme surface */}
      <rect
        x="16"
        y="16"
        width="480"
        height="480"
        rx="104"
        fill="var(--surface, #fbf9f3)"
        stroke="var(--outline-variant, #e4e2dc)"
        strokeWidth="1.5"
      />

      {/* Left figure — Green/Teal */}
      <circle cx="196" cy="150" r="38" fill="url(#leftFigGrad)" />
      <path
        d="M256,208 C220,160 140,180 140,240 C140,310 200,370 256,410 L256,208Z"
        fill="url(#leftFigGrad)"
      />

      {/* Right figure — Blue/Slate */}
      <circle cx="316" cy="150" r="38" fill="url(#rightFigGrad)" />
      <path
        d="M256,208 C292,160 372,180 372,240 C372,310 312,370 256,410 L256,208Z"
        fill="url(#rightFigGrad)"
      />

      {/* Central wallet with white border to pop */}
      <rect
        x="204"
        y="244"
        width="104"
        height="76"
        rx="18"
        fill="url(#walletGrad)"
        stroke="#ffffff"
        strokeWidth="4"
      />
      <rect
        x="250"
        y="262"
        width="58"
        height="40"
        rx="10"
        fill="url(#walletGrad)"
        stroke="#ffffff"
        strokeWidth="4"
      />
      <circle cx="288" cy="282" r="5" fill="#ffffff" />

      {/* Decorative border */}
      <rect
        x="16"
        y="16"
        width="480"
        height="480"
        rx="104"
        stroke="var(--primary, #8C936D)"
        strokeWidth="2"
        opacity="0.12"
        fill="none"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Wordmark: icon + "Balance" + Tagline                                */
/* ------------------------------------------------------------------ */

function WordmarkLogo({ tagline }: { tagline: string }) {
  return (
    <svg
      viewBox="0 0 800 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-full w-auto"
      role="img"
      aria-label="Balance logo"
    >
      <defs>
        <linearGradient id="leftFigGradMini" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a3c4ad" />
          <stop offset="100%" stopColor="#7ba387" />
        </linearGradient>
        <linearGradient id="rightFigGradMini" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a5c4d4" />
          <stop offset="100%" stopColor="#7da2b8" />
        </linearGradient>
        <linearGradient id="walletGradMini" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8cb296" />
          <stop offset="100%" stopColor="#7298af" />
        </linearGradient>
      </defs>

      {/* Mini icon */}
      <g transform="translate(0,20) scale(1.6875)">
        <rect
          x="16"
          y="16"
          width="64"
          height="64"
          rx="16"
          fill="var(--surface, #fbf9f3)"
          stroke="var(--outline-variant, #e4e2dc)"
          strokeWidth="0.8"
        />

        {/* Left figure head & body */}
        <circle cx="40" cy="34" r="5" fill="url(#leftFigGradMini)" />
        <path
          d="M48,41.6 C43.2,35.2 32.5,38 32.5,46 C32.5,55 40.5,63 48,68.5Z"
          fill="url(#leftFigGradMini)"
        />

        {/* Right figure head & body */}
        <circle cx="56" cy="34" r="5" fill="url(#rightFigGradMini)" />
        <path
          d="M48,41.6 C52.8,35.2 63.5,38 63.5,46 C63.5,55 55.5,63 48,68.5Z"
          fill="url(#rightFigGradMini)"
        />

        {/* Wallet */}
        <rect
          x="41"
          y="46.5"
          width="14"
          height="10"
          rx="2.5"
          fill="url(#walletGradMini)"
          stroke="#ffffff"
          strokeWidth="0.8"
        />
        <rect
          x="47.2"
          y="48.8"
          width="7.8"
          height="5.4"
          rx="1.5"
          fill="url(#walletGradMini)"
          stroke="#ffffff"
          strokeWidth="0.8"
        />
        <circle cx="52.2" cy="51.5" r="0.7" fill="#ffffff" />
      </g>

      {/* Text */}
      <text
        x="130"
        y="68"
        fontFamily="'Hanken Grotesk', system-ui, sans-serif"
        fontSize="48"
        fontWeight="600"
        letterSpacing="-0.03em"
        fill="var(--foreground, #1b1c18)"
      >
        Balance
      </text>
      <text
        x="130"
        y="100"
        fontFamily="'Geist', monospace"
        fontSize="11"
        fontWeight="600"
        letterSpacing="0.14em"
        fill="var(--muted-foreground, #77786d)"
        style={{ textTransform: "uppercase" }}
      >
        {tagline}
      </text>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  B letter mark — refined version                                     */
/* ------------------------------------------------------------------ */

function BMarkLogo() {
  return (
    <svg
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-full w-auto"
      role="img"
      aria-label="Balance B logo"
    >
      <rect
        x="16"
        y="16"
        width="480"
        height="480"
        rx="104"
        fill="var(--surface, #fbf9f3)"
        stroke="var(--outline-variant, #e4e2dc)"
        strokeWidth="1.5"
      />
      <rect x="208" y="156" width="36" height="200" rx="8" fill="var(--primary, #8C936D)" />
      <path d="M236,156 Q360,156 360,204 Q360,236 328,252 Q308,262 236,262Z" fill="var(--primary, #8C936D)" />
      <path d="M236,262 Q368,262 368,314 Q368,362 236,362Z" fill="var(--primary, #8C936D)" />
      <path d="M236,184 Q332,184 332,204 Q332,220 236,230Z" fill="var(--surface, #fbf9f3)" opacity="0.85" />
      <path d="M236,286 Q336,286 336,312 Q336,334 236,334Z" fill="var(--surface, #fbf9f3)" opacity="0.85" />
      <rect
        x="16"
        y="16"
        width="480"
        height="480"
        rx="104"
        stroke="var(--primary, #8C936D)"
        strokeWidth="2"
        opacity="0.12"
        fill="none"
      />
    </svg>
  );
}

