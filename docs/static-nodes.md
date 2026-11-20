# Design: static pages, language in the path, signed bundles

Language lives in the path: `/en`, `/mi`, and `/bi`. `/` redirects from the `beehive-reo` cookie, then the first `Accept-Language` tag, then `/bi`. An old `?reo=` link redirects to that path.

## Why the pages stay dynamic

A production build with a static language layout was measured on Next.js 15.5.29. The home document (`/en`) contained 245 inline scripts and no nonce. It also contained 9 parser-inserted `<script src="/_next/static/...">` tags and no inline event handlers. The same count, 245, was on `/mi` and `/bi`. Shorter pages had 7 inline scripts.

Hashing those inline scripts is possible. The home page's `script-src` hash list alone is 13,264 characters, and each page's flight data hashes differ. That is not a policy Next emits.

Two further facts keep the nonce:

- `strict-dynamic` ignores `'self'`. The 9 chunk tags are parser-inserted and have no nonce, so a hash policy that keeps `strict-dynamic` would block them. The page would not hydrate.
- Next's experimental `sri` hashes external JavaScript files only. It does not hash the inline `self.__next_f.push` bootstrap. The documented SRI policy, `script-src 'self'`, blocks those inline scripts. SRI is webpack-only and does not cover this case.

A `<meta>` policy was not added. A second Content-Security-Policy is enforced together with the nonce policy. The language layout stays `force-dynamic`. `npm run build` fails if `.next/server/app/en.html`, `mi.html`, or `bi.html` exists.

The root layout reads `x-beehive-lang` from the middleware so `<html lang>` is `mi` on `/mi` and `en` on `/en` and `/bi`. It does not set a nonce attribute on `<html>`.

Paths the middleware matcher skips (`/_next/static`, images, and real asset extensions) get a separate `script-src 'self'` policy from `next.config`. That policy is not attached to HTML. Prefetch requests still pass through middleware. Skipping them on Next.js 15.5.29 returned 500.

## What this build writes

`npm run build` writes the public read API to `out/` by calling the same route handlers the dynamic deployment serves:

- `out/api/v1/index.json` is `GET /api/v1`
- collection files are the default page (`limit` 50, `offset` 0), and `offset/<n>.json` is the next page
- `items/<id>.json` is one record, including a decision's numeric Mātai report id when it has one
- `items/<id>/votes.json` is `GET /api/v1/decisions/<id>/votes`

`out/bundle-manifest.json` lists each file with a SHA-256 hex digest. `signed` is false. There is no minisign or cosign signature, and no private key in this repo. `npm run api:check` fails if a file differs from a fresh handler call, if a hash does not match, or if any object key is `access` or `payment`.

The route handlers stay in place. `output: "export"` is not set, because that mode drops route handlers and would publish the unhashed HTML above. `vercel.json` still builds the dynamic app.

Council text stays untrusted input. A community plug-in still runs outside this process and only hands back JSON that cites a real decision id.

## Still not built

1. A strict hash CSP for the pages, which waits on a Next.js bootstrap that can run under `strict-dynamic` without a per-request nonce.
2. A signature over the manifest. Bear holds that key. Do not invent one.
3. Bundle version and hashes on each page. The sync time is already on the home page and the methodology page.
4. `SOURCE_DATE_EPOCH`. The Next build is not claimed to be reproducible yet. CI uses Node 22.
