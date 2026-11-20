# Design: static pages, language in the path, signed bundles

Language lives in the path: `/en`, `/mi`, and `/bi`. `/` redirects from the `beehive-reo` cookie, then the first `Accept-Language` tag, then `/bi`. An old `?reo=` link redirects to that path. Full static export, hash-based CSP, and signed bundles are still not built.

## Why the pages stay dynamic

A production build with a static language layout prerendered 706 pages. Each home document contained 245 inline scripts and no nonce. The live policy is a per-request nonce plus `strict-dynamic`. That policy would block those scripts, so the language layout is `force-dynamic` until the hash policy below replaces the nonce. The root layout no longer reads cookies or headers, and it does not set a nonce attribute on `<html>`.

Paths the middleware matcher skips (`/_next/static`, images, and real asset extensions) get a separate `script-src 'self'` policy from `next.config`. That policy is not attached to HTML. A second Content-Security-Policy header is enforced together with the nonce policy, and `script-src 'self'` would cancel `strict-dynamic`.

## What the next change should do

1. Pre-render the pages. Write `/api/v1` as JSON files under `out/`, then set `output: "export"`. No Node server is required to read the site.
2. Replace the nonce. Hash every inline bootstrap script with SHA-256 at build time. Turn on Next's experimental subresource integrity for chunks. Serve the policy as an HTTP header, not a `<meta>` tag. Keep `strict-dynamic`. Add a CI check that every inline script in `out/` is covered by a hash.
3. On each sync, publish a versioned bundle: `decisions.json`, `manifest.json` with SHA-256 hashes, and a signature (minisign or cosign). The public key lives in this repo. A mirror checks the signature and serves the files with Caddy or `npx serve`. No account, no tracker, no single hosted backend.
4. Show the bundle version, sync time, and hashes on each page.
5. Keep builds reproducible: `npm ci`, a pinned Node version, and `SOURCE_DATE_EPOCH`.

Council text stays untrusted input. A community plug-in still runs outside this process and only hands back JSON that cites a real decision id.
