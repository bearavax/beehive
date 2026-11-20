import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
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
import { listCommittees, listDecisions, listIssues, listMeetings, listMembers } from "../src/lib/sdk/wcc-catalog.ts";
import { renderPublic, writeStaticApi } from "./api-surface.ts";

function origin(url: string) {
  return new Request(`http://beehive.local${url}`);
}

function context(id: string) {
  return { params: Promise.resolve({ id }) };
}

function forbidKeys(value: unknown, where: string) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => forbidKeys(item, `${where}[${index}]`));
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    assert.notEqual(key, "access", where);
    assert.notEqual(key, "payment", where);
    forbidKeys(child, `${where}.${key}`);
  }
}

test("static api files match the route handlers", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "beehive-api-"));
  try {
    const manifest = await writeStaticApi(dir);
    assert.equal(manifest.signed, false);
    assert.equal(manifest.api, "beehive.v1");
    assert.ok(manifest.files.length > 200);

    const decision = listDecisions()[0];
    const meeting = listMeetings()[0];
    const member = listMembers()[0];
    const issue = listIssues()[0];
    const committee = listCommittees()[0];
    assert.ok(decision);
    assert.ok(meeting);
    assert.ok(member);
    assert.ok(issue);
    assert.ok(committee);
    const samples = [
      { url: "/api/v1", body: await (await indexGet()).text() },
      { url: "/api/v1/decisions", body: await (await decisionsGet(origin("/api/v1/decisions"))).text() },
      {
        url: "/api/v1/decisions?limit=50&offset=50",
        body: await (await decisionsGet(origin("/api/v1/decisions?limit=50&offset=50"))).text(),
      },
      {
        url: `/api/v1/decisions/${decision.id}`,
        body: await (await decisionGet(origin(`/api/v1/decisions/${decision.id}`), context(decision.id))).text(),
      },
      {
        url: `/api/v1/decisions/${decision.id}/votes`,
        body: await (await votesGet(origin(`/api/v1/decisions/${decision.id}/votes`), context(decision.id))).text(),
      },
      { url: "/api/v1/members", body: await (await membersGet(origin("/api/v1/members"))).text() },
      {
        url: `/api/v1/members/${member.id}`,
        body: await (await memberGet(origin(`/api/v1/members/${member.id}`), context(member.id))).text(),
      },
      { url: "/api/v1/issues", body: await (await issuesGet(origin("/api/v1/issues"))).text() },
      {
        url: `/api/v1/issues/${issue.id}`,
        body: await (await issueGet(origin(`/api/v1/issues/${issue.id}`), context(issue.id))).text(),
      },
      { url: "/api/v1/committees", body: await (await committeesGet(origin("/api/v1/committees"))).text() },
      {
        url: `/api/v1/committees/${committee.id}`,
        body: await (await committeeGet(origin(`/api/v1/committees/${committee.id}`), context(committee.id))).text(),
      },
      { url: "/api/v1/meetings", body: await (await meetingsGet(origin("/api/v1/meetings"))).text() },
      {
        url: `/api/v1/meetings/${meeting.id}`,
        body: await (await meetingGet(origin(`/api/v1/meetings/${meeting.id}`), context(meeting.id))).text(),
      },
    ];
    if (decision.reportId !== null) {
      const id = String(decision.reportId);
      samples.push({
        url: `/api/v1/decisions/${id}`,
        body: await (await decisionGet(origin(`/api/v1/decisions/${id}`), context(id))).text(),
      });
    }

    for (const sample of samples) {
      const entry = manifest.files.find((file) => file.url === sample.url);
      assert.ok(entry, sample.url);
      const text = await readFile(path.join(dir, entry.path), "utf8");
      assert.equal(text, sample.body);
      assert.equal(text, await renderPublic(sample.url));
      const parsed = JSON.parse(text) as { api?: string; data?: { implementation?: { status?: unknown } } };
      assert.equal(parsed.api, "beehive.v1");
      forbidKeys(parsed, sample.url);
    }

    const listed = JSON.parse(samples.find((sample) => sample.url === "/api/v1/decisions")?.body ?? "") as {
      data: Array<{ implementation: { status: string | null } }>;
    };
    assert.ok(listed.data.length > 0);
    for (const row of listed.data) {
      assert.ok(row.implementation);
      assert.ok(
        row.implementation.status === null ||
          row.implementation.status === "In progress" ||
          row.implementation.status === "Completed",
      );
    }

    const detail = JSON.parse(samples.find((sample) => sample.url === `/api/v1/decisions/${decision.id}`)?.body ?? "") as {
      data: { id: string; title: string };
    };
    assert.equal(detail.data.id, decision.id);
    assert.equal(typeof detail.data.title, "string");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
