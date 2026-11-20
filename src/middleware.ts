import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isLang, type Lang } from "@/lib/lang";

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

function preferredLang(request: NextRequest): Lang {
  const saved = request.cookies.get("beehive-reo")?.value;
  if (isLang(saved)) return saved;
  const first = (request.headers.get("accept-language") ?? "").split(",")[0]?.trim().toLowerCase() ?? "";
  if (first.startsWith("mi")) return "mi";
  return "bi";
}

function remember(response: NextResponse, lang: Lang) {
  response.cookies.set("beehive-reo", lang, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    secure: true,
  });
}

export function middleware(request: NextRequest) {
  const token = nonce();
  const csp = contentSecurityPolicy(token);
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api")) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-nonce", token);
    requestHeaders.set("content-security-policy", csp);
    const response = NextResponse.next({ request: { headers: requestHeaders } });
    response.headers.set("content-security-policy", csp);
    return response;
  }

  const requested = request.nextUrl.searchParams.get("reo");
  const segment = pathname.split("/")[1];
  const url = request.nextUrl.clone();
  url.searchParams.delete("reo");

  if (isLang(requested) && segment !== requested) {
    const rest = isLang(segment) ? pathname.slice(segment.length + 1) : pathname;
    url.pathname = rest === "/" ? `/${requested}` : `/${requested}${rest.startsWith("/") ? rest : `/${rest}`}`;
    const response = NextResponse.redirect(url);
    response.headers.set("content-security-policy", csp);
    remember(response, requested);
    return response;
  }

  if (!isLang(segment)) {
    const lang = preferredLang(request);
    url.pathname = pathname === "/" ? `/${lang}` : `/${lang}${pathname}`;
    const response = NextResponse.redirect(url);
    response.headers.set("content-security-policy", csp);
    remember(response, lang);
    return response;
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", token);
  requestHeaders.set("content-security-policy", csp);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("content-security-policy", csp);
  remember(response, segment);
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:ico|png|jpg|jpeg|gif|webp|svg|css|js|map|txt|xml|woff2?|json)$).*)",
  ],
};
