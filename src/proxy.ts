import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  matcher: [
    // Skip Next internals + API routes + static assets
    "/((?!api|_next|_vercel|.*\\..*).*)",
  ],
};
