import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isApiPath, planLanguage, preferredLang } from "@/lib/request-routing";

function contentSecurityPolicy(nonce: string) {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'none'",
    "form-action 'self'",
    "object-src 'none'",
  ].join("; ");
}

function nonce() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return btoa(String.fromCharCode(...bytes));
}

function remember(response: NextResponse, lang: "en" | "mi" | "bi") {
  response.cookies.set("beehive-reo", lang, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    secure: true,
  });
}

function privateDocument(response: NextResponse, csp: string) {
  response.headers.set("content-security-policy", csp);
  response.headers.set("cache-control", "private, no-store");
  response.headers.set("vary", "Cookie, Accept-Language");
  return response;
}

export function middleware(request: NextRequest) {
  const token = nonce();
  const csp = contentSecurityPolicy(token);
  const { pathname } = request.nextUrl;

  if (isApiPath(pathname)) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-nonce", token);
    requestHeaders.set("content-security-policy", csp);
    const response = NextResponse.next({ request: { headers: requestHeaders } });
    response.headers.set("content-security-policy", csp);
    return response;
  }

  const plan = planLanguage(
    pathname,
    request.nextUrl.searchParams.get("reo"),
    preferredLang(request.cookies.get("beehive-reo")?.value, request.headers.get("accept-language")),
  );
  const url = request.nextUrl.clone();
  url.searchParams.delete("reo");

  if (plan.action === "redirect") {
    url.pathname = plan.pathname;
    const response = NextResponse.redirect(url);
    privateDocument(response, csp);
    remember(response, plan.lang);
    return response;
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", token);
  requestHeaders.set("content-security-policy", csp);
  requestHeaders.set("x-beehive-lang", plan.lang);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  privateDocument(response, csp);
  remember(response, plan.lang);
  return response;
}

export const config = {
  matcher: [
    {
      // Skip Next's static assets and real file extensions. A dotted decision
      // slug such as /en/decisions/a.b still gets the nonce policy.
      // Prefetch is not excluded: skipping middleware made those requests 500.
      source: "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:ico|png|jpg|jpeg|gif|webp|svg|css|js|map|txt|xml|woff2?|json)$).*)",
    },
  ],
};
