import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

const PORT = 18088;

test("nginx serves the static API without a rewrite loop", async () => {
  const nginx = spawnSync("nginx", ["-v"], { encoding: "utf8" });
  assert.equal(nginx.error, undefined, "nginx is required");
  const root = mkdtempSync(path.join(tmpdir(), "beehive-nginx-"));
  const prefix = mkdtempSync(path.join(tmpdir(), "beehive-nginx-prefix-"));
  const files: Record<string, string> = {
    "api/v1/index.json": '{"name":"index"}\n',
    "api/v1/decisions.json": '{"name":"decisions"}\n',
    "api/v1/decisions/items/1734.json": '{"name":"one"}\n',
    "api/v1/decisions/items/1734/votes.json": '{"name":"votes"}\n',
    "api/v1/members/items/andrew-little.json": '{"name":"member"}\n',
    "api/v1/members/items/andrew-little/votes.json": '{"name":"member-votes"}\n',
    "api/v1/issues/items/rates-planning.json": '{"name":"issue"}\n',
    "api/v1/committees/items/te-kaunihera.json": '{"name":"committee"}\n',
    "api/v1/meetings/items/te-kaunihera~2026-11-12.json": '{"name":"meeting"}\n',
  };
  for (const [file, body] of Object.entries(files)) {
    const target = path.join(root, file);
    mkdirSync(path.dirname(target), { recursive: true });
    writeFileSync(target, body);
  }
  const server = readFileSync(path.join("deploy", "mirror", "nginx.conf"), "utf8").replace(
    "root /var/www/beehive/out;",
    `root ${root};`,
  );
  for (const name of ["body", "proxy", "fastcgi", "uwsgi", "scgi"]) mkdirSync(path.join(prefix, name), { recursive: true });
  const conf = path.join(prefix, "nginx.conf");
  writeFileSync(
    conf,
    `worker_processes 1;
pid ${prefix}/nginx.pid;
error_log ${prefix}/error.log;
events { worker_connections 32; }
http {
  access_log off;
  client_body_temp_path ${prefix}/body;
  proxy_temp_path ${prefix}/proxy;
  fastcgi_temp_path ${prefix}/fastcgi;
  uwsgi_temp_path ${prefix}/uwsgi;
  scgi_temp_path ${prefix}/scgi;
  ${server}
}
`,
  );
  const child = spawn("nginx", ["-c", conf, "-p", prefix, "-g", "daemon off;"], { stdio: "ignore" });
  try {
    await waitForPort();
    const checks: [string, string][] = [
      ["/api/v1", "index"],
      ["/api/v1/decisions", "decisions"],
      ["/api/v1/decisions.json", "decisions"],
      ["/api/v1/decisions/1734", "one"],
      ["/api/v1/decisions/1734/votes", "votes"],
      ["/api/v1/members/andrew-little", "member"],
      ["/api/v1/members/andrew-little/votes", "member-votes"],
      ["/api/v1/issues/rates-planning", "issue"],
      ["/api/v1/committees/te-kaunihera", "committee"],
      ["/api/v1/meetings/te-kaunihera~2026-11-12", "meeting"],
    ];
    for (const [url, name] of checks) {
      const response = await fetch(`http://127.0.0.1:${PORT}${url}`);
      const text = await response.text();
      assert.equal(response.status, 200, `${url} ${text.slice(0, 120)}`);
      assert.equal(text.trim(), `{"name":"${name}"}`, url);
      assert.equal(response.headers.get("x-content-type-options"), "nosniff", url);
      assert.equal(response.headers.get("access-control-allow-origin"), "*", url);
      assert.match(response.headers.get("cache-control") ?? "", /max-age=3600/, url);
    }
  } finally {
    if (child.exitCode === null && child.signalCode === null) {
      child.kill("SIGTERM");
      await new Promise((resolve) => child.once("exit", resolve));
    }
    rmSync(root, { recursive: true, force: true });
    rmSync(prefix, { recursive: true, force: true });
  }
});

async function waitForPort() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${PORT}/api/v1`);
      if (response.ok || response.status === 404) return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }
  throw new Error("nginx did not listen");
}
