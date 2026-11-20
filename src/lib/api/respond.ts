import { NextResponse } from "next/server";

export const API_NAME = "beehive.v1";

const headers = {
  "cache-control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, HEAD, OPTIONS",
  "access-control-allow-headers": "Accept",
};

export function json(body: unknown, status = 200) {
  return NextResponse.json({ api: API_NAME, ...((body ?? {}) as object) }, { status, headers });
}

export function notFound(resource: string, id: string) {
  return json({ error: "not_found", resource, id }, 404);
}

export function badRequest(field: string) {
  return json({ error: "bad_request", field }, 400);
}

export function options() {
  return new NextResponse(null, { status: 204, headers });
}

export function slicePage<T>(items: T[], limit: number, offset: number) {
  return {
    total: items.length,
    limit,
    offset,
    data: items.slice(offset, offset + limit),
  };
}

export function readPage(url: URL): { error: string } | { limit: number; offset: number; bodyId: string | null; issue: string | null; from: string | null; to: string | null } {
  const limitRaw = url.searchParams.get("limit");
  const offsetRaw = url.searchParams.get("offset");
  if (limitRaw !== null && !/^\d+$/.test(limitRaw)) return { error: "limit" };
  if (offsetRaw !== null && !/^\d+$/.test(offsetRaw)) return { error: "offset" };
  const limit = limitRaw === null ? 50 : Math.min(100, Math.max(1, Number(limitRaw)));
  const offset = offsetRaw === null ? 0 : Number(offsetRaw);
  return {
    limit,
    offset,
    bodyId: url.searchParams.get("body"),
    issue: url.searchParams.get("issue"),
    from: url.searchParams.get("from"),
    to: url.searchParams.get("to"),
  };
}
