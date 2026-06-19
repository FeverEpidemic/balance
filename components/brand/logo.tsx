"use client";

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
  return (
    <span className={cn("inline-flex items-center", className)}>
      {variant === "wordmark" ? <WordmarkLogo /> : variant === "bmark" ? <BMarkLogo /> : <IconLogo />}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Balanced-icon: two figures + wallet                                 */
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
      {/* Background — uses theme surface */}
      <rect x="16" y="16" width="480" height="480" rx="104" fill="var(--surface, #fbf9f3)" stroke="var(--outline-variant, #e4e2dc)" strokeWidth="1.5" />
      {/* Left figure — sage green (doesn't change much between themes) */}
      <circle cx="168" cy="204" r="36" fill="var(--primary, #8C936D)" opacity="0.9" />
      <path d="M142,260 Q150,280 156,310 Q160,340 164,370 L176,370 Q180,340 184,310 Q190,280 198,260Z" fill="var(--primary, #8C936D)" opacity="0.9" />
      <path d="M155,278 Q180,300 210,312 Q215,314 215,310 Q215,306 210,304 Q185,292 162,274Z" fill="var(--primary-hover, #717854)" opacity="0.85" />
      {/* Right figure — warm beige → dark mode uses muted surface */}
      <circle cx="344" cy="204" r="36" fill="var(--surface-container, #dbdad4)" opacity="0.9" />
      <path d="M336,260 Q330,280 326,310 Q322,340 318,370 L306,370 Q302,340 298,310 Q294,280 288,260Z" fill="var(--surface-container, #dbdad4)" opacity="0.9" />
      <path d="M329,278 Q304,300 274,312 Q269,314 269,310 Q269,306 274,304 Q299,292 322,274Z" fill="var(--surface-container-high, #c7c7ba)" opacity="0.85" />
      {/* Wallet */}
      <rect x="204" y="250" width="104" height="76" rx="18" fill="url(#walletGrad)" />
      <path d="M226,250 Q256,236 286,250" stroke="var(--on-primary, #fcffe2)" strokeWidth="4" strokeLinecap="round" fill="none" />
      <circle cx="256" cy="284" r="8" stroke="var(--on-primary, #fcffe2)" strokeWidth="3" opacity="0.7" fill="none" />
      <line x1="226" y1="298" x2="286" y2="298" stroke="var(--on-primary, #fcffe2)" strokeWidth="2.5" opacity="0.4" strokeLinecap="round" />
      <line x1="226" y1="312" x2="276" y2="312" stroke="var(--on-primary, #fcffe2)" strokeWidth="2.5" opacity="0.3" strokeLinecap="round" />
      {/* Decorative border */}
      <rect x="16" y="16" width="480" height="480" rx="104" stroke="var(--primary, #8C936D)" strokeWidth="2" opacity="0.12" fill="none" />
      <defs>
        <linearGradient id="walletGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--primary, #8C936D)" />
          <stop offset="100%" stopColor="var(--primary-strong, #595f3d)" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Wordmark: icon + "Balance" + "SERENE CAPITAL"                       */
/* ------------------------------------------------------------------ */

function WordmarkLogo() {
  return (
    <svg
      viewBox="0 0 800 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-full w-auto"
      role="img"
      aria-label="Balance logo"
    >
      {/* Mini icon */}
      <g transform="translate(0,20) scale(1.6875)">
        <rect x="16" y="16" width="64" height="64" rx="16" fill="var(--surface, #fbf9f3)" stroke="var(--outline-variant, #e4e2dc)" strokeWidth="0.8" />
        <circle cx="34" cy="38" r="5.5" fill="var(--primary, #8C936D)" opacity="0.9" />
        <path d="M29,46 Q30,50 31,54 Q32,58 33,62 L35,62 Q36,58 37,54 Q38,50 39,46Z" fill="var(--primary, #8C936D)" opacity="0.9" />
        <path d="M30,48 Q36,54 42,56 Q43,56.5 43,55.5 Q43,54.5 42,54 Q37,52 31,48Z" fill="var(--primary-hover, #717854)" opacity="0.85" />
        <circle cx="62" cy="38" r="5.5" fill="var(--surface-container, #dbdad4)" opacity="0.9" />
        <path d="M59,46 Q58,50 57,54 Q56,58 55,62 L53,62 Q52,58 51,54 Q50,50 49,46Z" fill="var(--surface-container, #dbdad4)" opacity="0.9" />
        <path d="M58,48 Q52,54 46,56 Q45,56.5 45,55.5 Q45,54.5 46,54 Q51,52 57,48Z" fill="var(--surface-container-high, #c7c7ba)" opacity="0.85" />
        <rect x="33" y="52" width="22" height="16" rx="4" fill="url(--walletGrad)" />
        <path d="M35,52 Q38,46 41,52" stroke="var(--on-primary, #fcffe2)" strokeWidth="0.8" strokeLinecap="round" fill="none" />
        <circle cx="40" cy="56" r="1.5" stroke="var(--on-primary, #fcffe2)" strokeWidth="0.6" opacity="0.7" fill="none" />
        <line x1="36" y1="60" x2="44" y2="60" stroke="var(--on-primary, #fcffe2)" strokeWidth="0.5" opacity="0.4" strokeLinecap="round" />
        <line x1="36" y1="64" x2="41" y2="64" stroke="var(--on-primary, #fcffe2)" strokeWidth="0.5" opacity="0.3" strokeLinecap="round" />
      </g>
      {/* Text */}
      <text x="130" y="68" fontFamily="'Hanken Grotesk', system-ui, sans-serif" fontSize="48" fontWeight="600" letterSpacing="-0.03em" fill="var(--foreground, #1b1c18)">Balance</text>
      <text x="130" y="100" fontFamily="'Geist', monospace" fontSize="13" fontWeight="600" letterSpacing="0.22em" fill="var(--muted-foreground, #77786d)" style={{ textTransform: "uppercase" }}>SERENE CAPITAL</text>
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
      <rect x="16" y="16" width="480" height="480" rx="104" fill="var(--surface, #fbf9f3)" stroke="var(--outline-variant, #e4e2dc)" strokeWidth="1.5" />
      <rect x="208" y="156" width="36" height="200" rx="8" fill="var(--primary, #8C936D)" />
      <path d="M236,156 Q360,156 360,204 Q360,236 328,252 Q308,262 236,262Z" fill="var(--primary, #8C936D)" />
      <path d="M236,262 Q368,262 368,314 Q368,362 236,362Z" fill="var(--primary, #8C936D)" />
      <path d="M236,184 Q332,184 332,204 Q332,220 236,230Z" fill="var(--surface, #fbf9f3)" opacity="0.85" />
      <path d="M236,286 Q336,286 336,312 Q336,334 236,334Z" fill="var(--surface, #fbf9f3)" opacity="0.85" />
      <rect x="16" y="16" width="480" height="480" rx="104" stroke="var(--primary, #8C936D)" strokeWidth="2" opacity="0.12" fill="none" />
    </svg>
  );
}
