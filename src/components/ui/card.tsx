import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Card({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "border-foreground/10 bg-background rounded-lg border shadow-sm",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children }: { children: ReactNode }) {
  return (
    <div className="border-foreground/10 border-b px-6 py-4">{children}</div>
  );
}

export function CardTitle({ children }: { children: ReactNode }) {
  return <h2 className="text-lg font-semibold">{children}</h2>;
}

export function CardDescription({ children }: { children: ReactNode }) {
  return <p className="text-foreground/60 mt-1 text-sm">{children}</p>;
}

export function CardBody({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <div className={cn("px-6 py-5", className)}>{children}</div>;
}
