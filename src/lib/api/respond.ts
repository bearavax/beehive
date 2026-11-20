import { NextResponse } from "next/server";
import { committees } from "@/data/committees";
import { issues } from "@/data/issues";

export const API_NAME = "beehive.v1";

const MAX_OFFSET = 5000;

const BODY_IDS = new Set(committees.map((committee) => committee.id));
const ISSUE_IDS = new Set(issues.map((issue) => issue.slug));

const publicHeaders = {
  "cache-control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, HEAD, OPTIONS",
  "access-control-allow-headers": "Accept",
};

const errorHeaders = {
  "cache-control": "no-store",
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, HEAD, OPTIONS",
  "access-control-allow-headers": "Accept",
};

export function json(body: unknown, status = 200) {
  const headers = status >= 400 ? errorHeaders : publicHeaders;
  return NextResponse.json({ api: API_NAME, ...((body ?? {}) as object) }, { status, headers });
}

export function notFound(resource: string, id: string) {
  return json({ error: "not_found", resource, id }, 404);
}

export function badRequest(field: string) {
  return json({ error: "bad_request", field }, 400);
}

export function options() {
  return new NextResponse(null, { status: 204, headers: publicHeaders });
}

export function slicePage<T>(items: T[], limit: number, offset: number) {
  return {
    total: items.length,
    limit,
    offset,
    data: items.slice(offset, offset + limit),
  };
}

/** Path ids are already decoded by Next.js. A second decode throws on a stray %. Reject those. */
const ID_PATTERN = /^[a-z0-9āēīōū.~-]{1,120}$/i;

export function readResourceId(id: string): { error: "id" } | { id: string } {
  if (id.includes("%") || id.includes("/") || id.includes("\\") || id.includes("..")) return { error: "id" };
  if (!ID_PATTERN.test(id)) return { error: "id" };
  return { id };
}

function isDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export function readPage(
  url: URL,
): { error: string } | { limit: number; offset: number; bodyId: string | null; issue: string | null; from: string | null; to: string | null } {
  const limitRaw = url.searchParams.get("limit");
  const offsetRaw = url.searchParams.get("offset");
  if (limitRaw !== null && !/^\d+$/.test(limitRaw)) return { error: "limit" };
  if (offsetRaw !== null && !/^\d+$/.test(offsetRaw)) return { error: "offset" };
  const limit = limitRaw === null ? 50 : Math.min(100, Math.max(1, Number(limitRaw)));
  const offset = offsetRaw === null ? 0 : Number(offsetRaw);
  if (offset > MAX_OFFSET) return { error: "offset" };

  const bodyId = url.searchParams.get("body");
  const issue = url.searchParams.get("issue");
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  if (bodyId && !BODY_IDS.has(bodyId)) return { error: "body" };
  if (issue && !ISSUE_IDS.has(issue)) return { error: "issue" };
  if (from && !isDate(from)) return { error: "from" };
  if (to && !isDate(to)) return { error: "to" };
  if (from && to && from > to) return { error: "from" };

  return { limit, offset, bodyId: bodyId || null, issue: issue || null, from: from || null, to: to || null };
}
