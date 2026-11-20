# Design: static pages, language in the path, signed bundles

Not built. This is the next structural step after the security headers, not part of the hardening change.

## Content Security Policy in the meantime

Next.js writes inline bootstrap scripts. A policy of `script-src 'self'` alone was checked against a rendered page and would block them. The live policy keeps every other directive from the review and adds a per-request nonce plus `strict-dynamic` so those scripts can run. A fully static export can drop the nonce because there is no per-request middleware.

## Why it is not in this change

The site still reads the language cookie in the root layout, so pages are dynamic. `output: "export"` cannot serve the current `/api/v1` route handlers. Moving language to `/en`, `/mi`, and `/bi` rewrites every page and the share links. Signing a data bundle needs a release key and a verifier. Doing those in the same change as the Next.js upgrade would mix a framework bump with a routing rewrite.

## What the next change should do

1. Put language in the path (`/en`, `/mi`, `/bi`) and stop reading it from a cookie. Share links already carry the language. The secure cookie can go away.
2. Pre-render the pages and write `/api/v1` as JSON files under `out/`, then set `output: "export"`. No Node server is required to read the site.
3. On each sync, publish a versioned bundle: `decisions.json`, `manifest.json` with SHA-256 hashes, and a signature (minisign or cosign). The public key lives in this repo. A mirror checks the signature and serves the files with Caddy or `npx serve`. No account, no tracker, no single hosted backend.
4. Show the bundle version, sync time, and hashes on each page.
5. Keep builds reproducible: `npm ci`, a pinned Node version, and `SOURCE_DATE_EPOCH`.

Council text stays untrusted input. A community plug-in still runs outside this process and only hands back JSON that cites a real decision id.
