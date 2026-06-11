import { cn } from "@/lib/utils";
import {
  Table as ShadcnTable,
  TableHeader as ShadcnTableHeader,
  TableBody as ShadcnTableBody,
  TableRow as ShadcnTableRow,
  TableHead as ShadcnTableHead,
  TableCell as ShadcnTableCell,
  TableCaption as ShadcnTableCaption,
} from "@/components/ui/shadcn/table";
import type { ComponentPropsWithoutRef, HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from "react";

export function Table({ className, ...props }: HTMLAttributes<HTMLTableElement>) {
  return <ShadcnTable className={cn(className)} {...props} />;
}

export function TableHeader({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <ShadcnTableHeader className={cn("[&_tr]:border-b [&_tr]:border-border", className)} {...props} />;
}

export function TableBody({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <ShadcnTableBody className={cn("[&_tr:last-child]:border-0", className)} {...props} />;
}

export function TableRow({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return <ShadcnTableRow className={cn("border-b border-border transition-colors", className)} {...props} />;
}

export function TableHead({ className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <ShadcnTableHead
      className={cn(
        "h-12 px-4 text-left align-middle font-label text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground",
        className
      )}
      {...props}
    />
  );
}

export function TableCell({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <ShadcnTableCell className={cn("px-4 py-4 align-middle", className)} {...props} />;
}

export function TableCaption({ className, ...props }: ComponentPropsWithoutRef<"caption">) {
  return <ShadcnTableCaption className={cn("mt-4 text-sm text-muted-foreground", className)} {...props} />;
}
