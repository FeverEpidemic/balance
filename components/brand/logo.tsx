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
      viewBox="0 0 640 120"
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
      <g>
        <rect
          x="6"
          y="6"
          width="108"
          height="108"
          rx="24"
          fill="var(--surface, #fbf9f3)"
          stroke="var(--outline-variant, #e4e2dc)"
          strokeWidth="1.2"
        />

        {/* Left figure head & body */}
        <circle cx="46.5" cy="36.5" r="8.5" fill="url(#leftFigGradMini)" />
        <path
          d="M60,49.2 C51.9,38.4 33.84,43.1 33.84,56.6 C33.84,71.8 47.3,85.3 60,94.6Z"
          fill="url(#leftFigGradMini)"
        />

        {/* Right figure head & body */}
        <circle cx="73.5" cy="36.5" r="8.5" fill="url(#rightFigGradMini)" />
        <path
          d="M60,49.2 C68.1,38.4 86.16,43.1 86.16,56.6 C86.16,71.8 72.7,85.3 60,94.6Z"
          fill="url(#rightFigGradMini)"
        />

        {/* Wallet */}
        <rect
          x="48"
          y="57.5"
          width="24"
          height="17"
          rx="4"
          fill="url(#walletGradMini)"
          stroke="#ffffff"
          strokeWidth="1.2"
        />
        <rect
          x="58.6"
          y="61.3"
          width="13"
          height="9"
          rx="2"
          fill="url(#walletGradMini)"
          stroke="#ffffff"
          strokeWidth="1.2"
        />
        <circle cx="67" cy="65.8" r="1.2" fill="#ffffff" />
      </g>

      {/* Text */}
      <text
        x="136"
        y="64"
        fontFamily="'Hanken Grotesk', system-ui, sans-serif"
        fontSize="54"
        fontWeight="600"
        letterSpacing="-0.03em"
        fill="var(--foreground, #1b1c18)"
      >
        Balance
      </text>
      <text
        x="136"
        y="96"
        fontFamily="'Geist', monospace"
        fontSize="15"
        fontWeight="600"
        letterSpacing="0.12em"
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

