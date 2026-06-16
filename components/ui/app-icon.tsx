"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type IconTone = "default" | "muted" | "primary" | "success" | "danger" | "inherit";

type AppIconName =
  | "dashboard"
  | "wallet"
  | "transactions"
  | "savings"
  | "budgets"
  | "reports"
  | "members"
  | "settlements"
  | "templates"
  | "changelog"
  | "settings"
  | "chat"
  | "overview"
  | "automatic"
  | "menu"
  | "plus"
  | "edit"
  | "download"
  | "category";

type CategoryIconName =
  | "food"
  | "transport"
  | "home"
  | "salary"
  | "shopping"
  | "health"
  | "entertainment"
  | "education"
  | "travel"
  | "bills"
  | "saving"
  | "adjustment"
  | "other-income"
  | "other-expense";

function iconToneClassName(tone: IconTone) {
  switch (tone) {
    case "muted":
      return "text-muted-foreground";
    case "primary":
      return "text-primary";
    case "success":
      return "text-success";
    case "danger":
      return "text-danger";
    case "inherit":
      return "text-inherit";
    default:
      return "text-foreground";
  }
}

function StrokeIcon({
  children,
  className,
  tone = "default",
  viewBox = "0 0 24 24"
}: {
  children: ReactNode;
  className?: string;
  tone?: IconTone;
  viewBox?: string;
}) {
  return (
    <svg
      viewBox={viewBox}
      fill="none"
      aria-hidden="true"
      className={cn("h-4 w-4 shrink-0 stroke-current", iconToneClassName(tone), className)}
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

export function AppIcon({
  name,
  className,
  tone = "default"
}: {
  name: AppIconName;
  className?: string;
  tone?: IconTone;
}) {
  switch (name) {
    case "dashboard":
      return (
        <StrokeIcon className={className} tone={tone}>
          <path d="M4.5 12.5h6v7h-6zM13.5 4.5h6v6h-6zM13.5 13.5h6v6h-6zM4.5 4.5h6v5h-6z" />
        </StrokeIcon>
      );
    case "wallet":
      return (
        <StrokeIcon className={className} tone={tone}>
          <path d="M4.5 8.5h14a1 1 0 0 1 1 1v8a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2h9" />
          <path d="M15.5 13h4" />
          <path d="M16.75 6.5h-9a2 2 0 0 0-2 2" />
        </StrokeIcon>
      );
    case "transactions":
      return (
        <StrokeIcon className={className} tone={tone}>
          <path d="M7 7h10" />
          <path d="M7 12h10" />
          <path d="M7 17h7" />
          <path d="M4.5 7h.01M4.5 12h.01M4.5 17h.01" />
        </StrokeIcon>
      );
    case "savings":
      return (
        <StrokeIcon className={className} tone={tone}>
          <path d="M12 4.5c-3.6 0-6.5 1.9-6.5 4.25S8.4 13 12 13s6.5-1.9 6.5-4.25S15.6 4.5 12 4.5Z" />
          <path d="M5.5 8.75V15c0 2.35 2.9 4.25 6.5 4.25s6.5-1.9 6.5-4.25V8.75" />
          <path d="M12 8v1.5" />
        </StrokeIcon>
      );
    case "budgets":
      return (
        <StrokeIcon className={className} tone={tone}>
          <path d="M5 19.5V10" />
          <path d="M12 19.5V4.5" />
          <path d="M19 19.5v-7" />
        </StrokeIcon>
      );
    case "category":
      return (
        <StrokeIcon className={className} tone={tone}>
          <path d="M12 2H2v10l9.65 9.65a1 1 0 0 0 1.41 0l7.29-7.29a1 1 0 0 0 0-1.41L12 2Z" />
          <path d="M7 7h.01" />
        </StrokeIcon>
      );
    case "reports":
      return (
        <StrokeIcon className={className} tone={tone}>
          <path d="M5 18.5V12" />
          <path d="M10 18.5V7.5" />
          <path d="M15 18.5v-4" />
          <path d="M20 18.5V5.5" />
        </StrokeIcon>
      );
    case "members":
      return (
        <StrokeIcon className={className} tone={tone}>
          <path d="M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
          <path d="M16.5 10a2.5 2.5 0 1 0 0-5" />
          <path d="M4.5 18.5a4.5 4.5 0 0 1 9 0" />
          <path d="M14.5 18.5a4 4 0 0 1 5-3.86" />
        </StrokeIcon>
      );
    case "settlements":
      return (
        <StrokeIcon className={className} tone={tone}>
          <path d="M4.5 8.5h10" />
          <path d="m11.5 5.5 3 3-3 3" />
          <path d="M19.5 15.5h-10" />
          <path d="m12.5 12.5-3 3 3 3" />
        </StrokeIcon>
      );
    case "templates":
      return (
        <StrokeIcon className={className} tone={tone}>
          <path d="M7 5.5h10a1.5 1.5 0 0 1 1.5 1.5v10A1.5 1.5 0 0 1 17 18.5H7A1.5 1.5 0 0 1 5.5 17V7A1.5 1.5 0 0 1 7 5.5Z" />
          <path d="M8.5 9.5h7" />
          <path d="M8.5 13h7" />
        </StrokeIcon>
      );
    case "changelog":
      return (
        <StrokeIcon className={className} tone={tone}>
          <path d="M6.5 7.5h8.5a2.5 2.5 0 0 1 2.5 2.5v7.5l-3-2h-8A2.5 2.5 0 0 1 4 13V10a2.5 2.5 0 0 1 2.5-2.5Z" />
          <path d="M8 10.5h5" />
          <path d="M8 13h3.5" />
          <path d="M18 4.5v2" />
          <path d="M20.5 7h-2" />
          <path d="m19.75 5.25-1.5 1.5" />
        </StrokeIcon>
      );
    case "settings":
      return (
        <StrokeIcon className={className} tone={tone}>
          <path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z" />
          <path d="M19 12a7 7 0 0 0-.08-1l1.75-1.35-1.7-2.95-2.1.67a7.1 7.1 0 0 0-1.73-1L14.75 4h-3.5l-.39 2.37a7.1 7.1 0 0 0-1.73 1l-2.1-.67-1.7 2.95L5.08 11a7 7 0 0 0 0 2l-1.75 1.35 1.7 2.95 2.1-.67a7.1 7.1 0 0 0 1.73 1l.39 2.37h3.5l.39-2.37a7.1 7.1 0 0 0 1.73-1l2.1.67 1.7-2.95L18.92 13c.05-.33.08-.66.08-1Z" />
        </StrokeIcon>
      );
    case "chat":
      return (
        <StrokeIcon className={className} tone={tone}>
          <path d="M6.5 7h11A2.5 2.5 0 0 1 20 9.5v6A2.5 2.5 0 0 1 17.5 18H11l-4.5 2v-2H6.5A2.5 2.5 0 0 1 4 15.5v-6A2.5 2.5 0 0 1 6.5 7Z" />
          <path d="M8.5 11h7" />
          <path d="M8.5 14h4.5" />
        </StrokeIcon>
      );
    case "overview":
      return (
        <StrokeIcon className={className} tone={tone}>
          <path d="M5 12h5v7H5zM14 5h5v14h-5z" />
        </StrokeIcon>
      );
    case "automatic":
      return (
        <StrokeIcon className={className} tone={tone}>
          <path d="M17.5 9.5V5.5h-4" />
          <path d="M6.5 14.5v4h4" />
          <path d="M17 7a6.5 6.5 0 0 0-10.5 2" />
          <path d="M7 17a6.5 6.5 0 0 0 10.5-2" />
        </StrokeIcon>
      );
    case "menu":
      return (
        <StrokeIcon className={className} tone={tone}>
          <path d="M4.5 7.5h15" />
          <path d="M4.5 12h15" />
          <path d="M4.5 16.5h15" />
        </StrokeIcon>
      );
    case "plus":
      return (
        <StrokeIcon className={className} tone={tone}>
          <path d="M12 5v14" />
          <path d="M5 12h14" />
        </StrokeIcon>
      );
    case "edit":
      return (
        <StrokeIcon className={className} tone={tone}>
          <path d="m6 18 3.2-.7L18 8.5 15.5 6 6.7 14.8 6 18Z" />
          <path d="m13.5 8 2.5 2.5" />
        </StrokeIcon>
      );
    case "download":
      return (
        <StrokeIcon className={className} tone={tone}>
          <path d="M12 4.5v10" />
          <path d="m8.5 11.5 3.5 3.5 3.5-3.5" />
          <path d="M5 18.5h14" />
        </StrokeIcon>
      );
    default:
      return (
        <StrokeIcon className={className} tone={tone}>
          <path d="M6 7.5h12" />
          <path d="M6 12h12" />
          <path d="M6 16.5h8" />
        </StrokeIcon>
      );
  }
}

export function resolveCategoryIconName(categoryName: string, kind: "income" | "expense"): CategoryIconName {
  const normalized = categoryName.toLocaleLowerCase();

  if (normalized.includes("makan") || normalized.includes("food") || normalized.includes("grocer") || normalized.includes("resto")) {
    return "food";
  }
  if (normalized.includes("transport") || normalized.includes("ojek") || normalized.includes("fuel") || normalized.includes("bensin")) {
    return "transport";
  }
  if (normalized.includes("sewa") || normalized.includes("rent") || normalized.includes("rumah") || normalized.includes("home")) {
    return "home";
  }
  if (normalized.includes("gaji") || normalized.includes("salary") || normalized.includes("payroll")) {
    return "salary";
  }
  if (normalized.includes("belanja") || normalized.includes("shopping")) {
    return "shopping";
  }
  if (normalized.includes("sehat") || normalized.includes("health") || normalized.includes("medis")) {
    return "health";
  }
  if (normalized.includes("hiburan") || normalized.includes("entertain") || normalized.includes("movie")) {
    return "entertainment";
  }
  if (normalized.includes("eduk") || normalized.includes("sekolah") || normalized.includes("kursus") || normalized.includes("education")) {
    return "education";
  }
  if (normalized.includes("travel") || normalized.includes("liburan") || normalized.includes("trip")) {
    return "travel";
  }
  if (normalized.includes("listrik") || normalized.includes("air") || normalized.includes("internet") || normalized.includes("tagihan") || normalized.includes("bill")) {
    return "bills";
  }
  if (normalized.includes("tabungan") || normalized.includes("saving")) {
    return "saving";
  }
  if (normalized.includes("penyesuaian") || normalized.includes("adjustment")) {
    return "adjustment";
  }

  return kind === "income" ? "other-income" : "other-expense";
}

export function CategoryIcon({
  categoryName,
  kind,
  className,
  tone = "default"
}: {
  categoryName: string;
  kind: "income" | "expense";
  className?: string;
  tone?: IconTone;
}) {
  const name = resolveCategoryIconName(categoryName, kind);

  switch (name) {
    case "food":
      return (
        <StrokeIcon className={className} tone={tone}>
          <path d="M8 5.5v6" />
          <path d="M6 5.5v3.25C6 9.99 6.9 11 8 11s2-.99 2-2.25V5.5" />
          <path d="M15 5.5v13" />
          <path d="M13 8.5h4" />
        </StrokeIcon>
      );
    case "transport":
      return (
        <StrokeIcon className={className} tone={tone}>
          <path d="M7 15.5h10l1.5-4.5H5.5L7 15.5Z" />
          <path d="M8 11 9.5 7.5h5L16 11" />
          <path d="M8.5 17.5h.01M15.5 17.5h.01" />
        </StrokeIcon>
      );
    case "home":
      return (
        <StrokeIcon className={className} tone={tone}>
          <path d="m5.5 10.5 6.5-5 6.5 5" />
          <path d="M7.5 9.5v9h9v-9" />
          <path d="M10.5 18.5v-4h3v4" />
        </StrokeIcon>
      );
    case "salary":
      return (
        <StrokeIcon className={className} tone={tone}>
          <path d="M5.5 8.5h13v9h-13z" />
          <path d="M12 11v5" />
          <path d="M10 13h4" />
        </StrokeIcon>
      );
    case "shopping":
      return (
        <StrokeIcon className={className} tone={tone}>
          <path d="M7 9.5h10l-1 8H8L7 9.5Z" />
          <path d="M9.5 9.5V8a2.5 2.5 0 0 1 5 0v1.5" />
        </StrokeIcon>
      );
    case "health":
      return (
        <StrokeIcon className={className} tone={tone}>
          <path d="M12 6.5v11" />
          <path d="M6.5 12h11" />
          <path d="M7.5 4.5h9a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3h-9a3 3 0 0 1-3-3v-9a3 3 0 0 1 3-3Z" />
        </StrokeIcon>
      );
    case "entertainment":
      return (
        <StrokeIcon className={className} tone={tone}>
          <path d="M6 7.5h12v9H6z" />
          <path d="m10 10 4 2-4 2v-4Z" />
        </StrokeIcon>
      );
    case "education":
      return (
        <StrokeIcon className={className} tone={tone}>
          <path d="m4.5 9 7.5-4 7.5 4-7.5 4-7.5-4Z" />
          <path d="M7.5 11.5v3.5c0 1.1 2 2 4.5 2s4.5-.9 4.5-2v-3.5" />
        </StrokeIcon>
      );
    case "travel":
      return (
        <StrokeIcon className={className} tone={tone}>
          <path d="m10 13 2-8 2 8" />
          <path d="M5 13h14" />
          <path d="M12 13v5.5" />
        </StrokeIcon>
      );
    case "bills":
      return (
        <StrokeIcon className={className} tone={tone}>
          <path d="M8 4.5v6" />
          <path d="M13.5 9a2.5 2.5 0 1 1 0-5c1.38 0 2.5 1.12 2.5 2.5v11a2.5 2.5 0 1 1-5 0" />
        </StrokeIcon>
      );
    case "saving":
      return <AppIcon name="savings" className={className} tone={tone} />;
    case "adjustment":
      return (
        <StrokeIcon className={className} tone={tone}>
          <path d="M6 6.5h12" />
          <path d="M6 17.5h12" />
          <path d="m8.5 9.5-2.5-3 2.5-3" />
          <path d="m15.5 14.5 2.5 3-2.5 3" />
        </StrokeIcon>
      );
    case "other-income":
      return (
        <StrokeIcon className={className} tone="success">
          <path d="M12 5v14" />
          <path d="M7 10h5" />
          <path d="M5 12h14" />
        </StrokeIcon>
      );
    default:
      return (
        <StrokeIcon className={className} tone="danger">
          <path d="M5 12h14" />
          <path d="M12 7v10" />
        </StrokeIcon>
      );
  }
}
