import type { ReactNode } from "react";
import "./globals.css";

/**
 * Root layout — required by Next.js even when locale routing is handled
 * in `[locale]/layout.tsx`. The actual <html>/<body> wrappers live there
 * so that the lang attribute matches the active locale.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
