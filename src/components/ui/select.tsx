import type { SelectHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Select({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { children: ReactNode }) {
  return (
    <select
      className={cn(
        "border-foreground/20 bg-background text-foreground focus:border-foreground/60 h-10 w-full rounded-md border px-3 text-sm transition-colors outline-none disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}
