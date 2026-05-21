import type { Metadata } from "next";
import { Geist, Hanken_Grotesk, Inter } from "next/font/google";
import type { ReactNode } from "react";
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

export const metadata: Metadata = {
  title: "balance",
  description: "Aplikasi keuangan rumah tangga yang tenang, ringan, dan mobile responsive."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id">
      <body className={`${display.variable} ${body.variable} ${label.variable}`}>{children}</body>
    </html>
  );
}
