import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const reo = request.nextUrl.searchParams.get("reo");
  const requestHeaders = new Headers(request.headers);
  if (reo === "en" || reo === "mi" || reo === "bi") {
    requestHeaders.set("x-beehive-reo", reo);
  }
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  if (reo === "en" || reo === "mi" || reo === "bi") {
    response.cookies.set("beehive-reo", reo, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
