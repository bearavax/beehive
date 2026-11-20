import type { NextConfig } from "next";

const fallbackContentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'none'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: fallbackContentSecurityPolicy },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "no-referrer" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  async headers() {
    // The fallback policy is only safe on files the middleware matcher skips.
    // A second Content-Security-Policy on an HTML document is enforced as well
    // as the nonce policy, and script-src 'self' would cancel 'strict-dynamic'.
    const assets = [
      "/_next/static/:path*",
      "/_next/image",
      "/favicon.ico",
      "/:path*.:ext(ico|png|jpg|jpeg|gif|webp|svg|css|js|map|txt|xml|woff|woff2|json)",
    ];
    return [
      { source: "/:path*", headers: securityHeaders.filter((header) => header.key !== "Content-Security-Policy") },
      ...assets.map((source) => ({ source, headers: [{ key: "Content-Security-Policy", value: fallbackContentSecurityPolicy }] })),
    ];
  },
};

export default nextConfig;
