import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Textarea({
  className,
  rows = 3,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      rows={rows}
      className={cn(
        "border-foreground/20 bg-background text-foreground focus:border-foreground/60 placeholder:text-foreground/40 w-full rounded-md border px-3 py-2 text-sm transition-colors outline-none disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
