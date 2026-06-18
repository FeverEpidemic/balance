import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { Geist, Hanken_Grotesk, Inter } from "next/font/google";
import type { ReactNode } from "react";
import { ServiceWorkerRegistration } from "@/components/pwa/service-worker-registration";
import { SyncManager } from "@/components/pwa/sync-manager";
import { RouteTransition } from "@/components/ui/route-transition";
import { ToastProvider } from "@/components/ui/toast-provider";
import { Toaster } from "@/components/ui/shadcn/sonner";
import { getSiteUrl } from "@/lib/env";
import { LOCALE_COOKIE_NAME, defaultLocale, resolveLocale } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";
import { getThemeBootstrapScript, parseThemePreference, resolveAppliedTheme, THEME_COOKIE_NAME } from "@/lib/theme";
import { DEFAULT_TIMEZONE, resolveTimezone, TZ_COOKIE_NAME } from "@/lib/timezone";
import "./globals.css";

const display = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-display"
});

const body = Inter({
  subsets: ["latin"],
  variable: "--font-body"
});

const label = Geist({
  subsets: ["latin"],
  variable: "--font-label"
});

const siteUrl = new URL(getSiteUrl());

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: "Balance — Personal Finance Tracker",
    template: "%s — Balance",
  },
  description:
    "A calm, modern finance tracker to manage your income, expenses, and financial wellness — in rupiah.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Balance"
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" }
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }]
  },
  openGraph: {
    url: "https://mybalance.my.id",
    title: "Balance | Keuangan yang lebih tenang",
    description:
      "Aplikasi keuangan rumah tangga yang tenang, ringan, dan mobile responsive.",
    siteName: "Balance",
    locale: "id_ID",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        type: "image/png",
        alt: "Balance — Keuangan yang lebih tenang"
      }
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Balance",
    description:
      "A calm, modern finance tracker to manage your income, expenses, and financial wellness — in rupiah.",
    images: ["/opengraph-image"],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#595f3d" },
    { media: "(prefers-color-scheme: dark)", color: "#171c16" }
  ],
  colorScheme: "light dark"
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const cookiePreference = parseThemePreference(cookieStore.get(THEME_COOKIE_NAME)?.value);
  const localePreference = resolveLocale(cookieStore.get(LOCALE_COOKIE_NAME)?.value ?? defaultLocale);
  let themePreference = cookiePreference;

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase.from("profiles").select("theme_preference, timezone").eq("id", user.id).maybeSingle();
    themePreference = parseThemePreference(profile?.theme_preference);
    if (profile?.timezone) {
      // Profile override takes highest priority — set in cookie so SSR picks it up
      cookieStore.set(TZ_COOKIE_NAME, profile.timezone, {
        path: "/",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 365
      });
    }
  }

  // Resolve timezone: profile > cookie > default
  const cookieTimezone = resolveTimezone(cookieStore.get(TZ_COOKIE_NAME)?.value ?? null);

  const appliedTheme = resolveAppliedTheme(themePreference);

  return (
    <html
      lang={localePreference}
      suppressHydrationWarning
      data-theme={appliedTheme}
      data-theme-preference={themePreference}
      data-tz={cookieTimezone}
      style={{ colorScheme: appliedTheme }}
    >
      <body className={`${display.variable} ${body.variable} ${label.variable}`}>
        <script dangerouslySetInnerHTML={{ __html: getThemeBootstrapScript(themePreference) }} />
        <ToastProvider>
          <RouteTransition />
          <ServiceWorkerRegistration />
          <SyncManager />
          {children}
        </ToastProvider>
        <Toaster />
      </body>
    </html>
  );
}
