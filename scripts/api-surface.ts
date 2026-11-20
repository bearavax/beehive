import { createHash } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { GET as indexGet } from "../src/app/api/v1/route.ts";
import { GET as committeesGet } from "../src/app/api/v1/committees/route.ts";
import { GET as committeeGet } from "../src/app/api/v1/committees/[id]/route.ts";
import { GET as decisionsGet } from "../src/app/api/v1/decisions/route.ts";
import { GET as decisionGet } from "../src/app/api/v1/decisions/[id]/route.ts";
import { GET as votesGet } from "../src/app/api/v1/decisions/[id]/votes/route.ts";
import { GET as issuesGet } from "../src/app/api/v1/issues/route.ts";
import { GET as issueGet } from "../src/app/api/v1/issues/[id]/route.ts";
import { GET as meetingsGet } from "../src/app/api/v1/meetings/route.ts";
import { GET as meetingGet } from "../src/app/api/v1/meetings/[id]/route.ts";
import { GET as membersGet } from "../src/app/api/v1/members/route.ts";
import { GET as memberGet } from "../src/app/api/v1/members/[id]/route.ts";
import { GET as memberVotesGet } from "../src/app/api/v1/members/[id]/votes/route.ts";
import { readResourceId } from "../src/lib/api/respond.ts";
import { syncedAt } from "../src/lib/data.ts";
import {
  listCommittees,
  listDecisions,
  listIssues,
  listMeetings,
  listMembers,
} from "../src/lib/sdk/wcc-catalog.ts";

const ORIGIN = "http://beehive.local";
const PAGE = 50;

export type BundleFile = { url: string; path: string; sha256: string };

export type BundleManifest = {
  kind: "beehive-static-bundle";
  api: "beehive.v1";
  syncedAt: string;
  signed: false;
  note: string;
  files: BundleFile[];
};

type Published = { url: string; file: string };

function context(id: string) {
  return { params: Promise.resolve({ id }) };
}

function publishable(id: string, resource: string) {
  const parsed = readResourceId(id);
  if ("error" in parsed) throw new Error(`Refusing to publish ${resource} id ${id}`);
  return parsed.id;
}

function pages(resource: string, total: number): Published[] {
  const count = Math.max(1, Math.ceil(total / PAGE));
  const docs: Published[] = [];
  for (let page = 0; page < count; page += 1) {
    const offset = page * PAGE;
    docs.push({
      url: offset === 0 ? `/api/v1/${resource}` : `/api/v1/${resource}?limit=${PAGE}&offset=${offset}`,
      file: offset === 0 ? `api/v1/${resource}.json` : `api/v1/${resource}/offset/${offset}.json`,
    });
  }
  return docs;
}

function item(resource: string, id: string, votes = false): Published {
  const safe = publishable(id, resource);
  return {
    url: `/api/v1/${resource}/${safe}${votes ? "/votes" : ""}`,
    file: `api/v1/${resource}/items/${safe}${votes ? "/votes.json" : ".json"}`,
  };
}

export function staticDocuments(): Published[] {
  const decisions = listDecisions();
  const decisionIds = new Set<string>();
  for (const decision of decisions) {
    decisionIds.add(decision.id);
    if (decision.reportId !== null) decisionIds.add(String(decision.reportId));
  }
  const docs: Published[] = [
    { url: "/api/v1", file: "api/v1/index.json" },
    ...pages("decisions", decisions.length),
    ...[...decisionIds].flatMap((id) => [item("decisions", id), item("decisions", id, true)]),
    ...pages("members", listMembers().length),
    ...listMembers().flatMap((member) => [
      item("members", member.id),
      {
        url: `/api/v1/members/${publishable(member.id, "members")}/votes`,
        file: `api/v1/members/items/${publishable(member.id, "members")}/votes.json`,
      },
    ]),
    { url: "/api/v1/issues", file: "api/v1/issues.json" },
    ...listIssues().map((issue) => item("issues", issue.id)),
    { url: "/api/v1/committees", file: "api/v1/committees.json" },
    ...listCommittees().map((committee) => item("committees", committee.id)),
    ...pages("meetings", listMeetings().length),
    ...listMeetings().map((meeting) => item("meetings", meeting.id)),
  ];
  docs.sort((a, b) => (a.url < b.url ? -1 : a.url > b.url ? 1 : 0));
  return docs;
}

export async function renderPublic(url: string): Promise<string> {
  const parsed = new URL(url, ORIGIN);
  const request = new Request(parsed);
  const pathname = parsed.pathname;
  let response: Response;
  if (pathname === "/api/v1") response = await indexGet();
  else if (pathname === "/api/v1/decisions") response = await decisionsGet(request);
  else if (pathname === "/api/v1/members") response = await membersGet(request);
  else if (pathname === "/api/v1/meetings") response = await meetingsGet(request);
  else if (pathname === "/api/v1/issues") response = await issuesGet(request);
  else if (pathname === "/api/v1/committees") response = await committeesGet(request);
  else {
    const votes = pathname.match(/^\/api\/v1\/decisions\/([^/]+)\/votes$/);
    const decision = pathname.match(/^\/api\/v1\/decisions\/([^/]+)$/);
    const memberVotes = pathname.match(/^\/api\/v1\/members\/([^/]+)\/votes$/);
    const member = pathname.match(/^\/api\/v1\/members\/([^/]+)$/);
    const issue = pathname.match(/^\/api\/v1\/issues\/([^/]+)$/);
    const committee = pathname.match(/^\/api\/v1\/committees\/([^/]+)$/);
    const meeting = pathname.match(/^\/api\/v1\/meetings\/([^/]+)$/);
    if (votes) response = await votesGet(request, context(decodeURIComponent(votes[1])));
    else if (decision) response = await decisionGet(request, context(decodeURIComponent(decision[1])));
    else if (memberVotes) response = await memberVotesGet(request, context(decodeURIComponent(memberVotes[1])));
    else if (member) response = await memberGet(request, context(decodeURIComponent(member[1])));
    else if (issue) response = await issueGet(request, context(decodeURIComponent(issue[1])));
    else if (committee) response = await committeeGet(request, context(decodeURIComponent(committee[1])));
    else if (meeting) response = await meetingGet(request, context(decodeURIComponent(meeting[1])));
    else throw new Error(`No public route for ${pathname}`);
  }
  if (response.status !== 200) throw new Error(`${url} returned ${response.status}`);
  return response.text();
}

export async function writeStaticApi(dir: string): Promise<BundleManifest> {
  const resolved = path.resolve(dir);
  if (resolved === path.parse(resolved).root || resolved === path.resolve(".")) {
    throw new Error(`Refusing to replace ${dir}`);
  }
  await rm(resolved, { recursive: true, force: true });
  await mkdir(resolved, { recursive: true });

  const files: BundleFile[] = [];
  for (const doc of staticDocuments()) {
    const body = await renderPublic(doc.url);
    const target = path.join(resolved, doc.file);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, body);
    files.push({
      url: doc.url,
      path: doc.file,
      sha256: createHash("sha256").update(body).digest("hex"),
    });
  }

  const manifest: BundleManifest = {
    kind: "beehive-static-bundle",
    api: "beehive.v1",
    syncedAt,
    signed: false,
    note: "Hashes only. Unsigned until Bear publishes a minisign or cosign public key. This file is not a signature.",
    files,
  };
  await writeFile(path.join(resolved, "bundle-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  return manifest;
}
