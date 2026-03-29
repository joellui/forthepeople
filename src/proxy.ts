/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Match all pathnames except for internal Next.js/API routes
  matcher: [
    "/",
    "/(en|kn)/:path*",
    "/((?!_next|_vercel|api|.*\\..*).*)",
  ],
};
