import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "border-foreground/20 bg-background text-foreground focus:border-foreground/60 placeholder:text-foreground/40 h-10 w-full rounded-md border px-3 text-sm transition-colors outline-none disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
