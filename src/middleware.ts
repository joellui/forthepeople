/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Watermark headers on every response — proof of origin
  response.headers.set("X-Powered-By", "ForThePeople.in");
  response.headers.set("X-Creator", "Jayanth M B");
  response.headers.set("X-Project-ID", "FTP-JMB-2026-IN");
  response.headers.set(
    "X-License",
    "MIT with Attribution — github.com/jayanthmb14/forthepeople"
  );

  return response;
}

// Apply to all routes except static assets
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.webmanifest).*)"],
};
