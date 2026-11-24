#!/usr/bin/env node
/**
 * Runs automatically before `npm run dev` (npm "predev" hook).
 * Makes sure a Redis server is reachable so the Explore feed, rate limiting
 * and the write-behind queue work without starting Redis by hand.
 *
 * Order of attempts:
 *   1. Redis already reachable on REDIS_URL host/port -> nothing to do
 *   2. Docker  -> `docker compose up -d --wait redis`  (uses docker-compose.yml)
 *   3. Local   -> `redis-server --daemonize yes`        (brew / apt install)
 * If none work it prints a warning and lets the dev server start anyway.
 */
const net = require("net");
const { spawnSync } = require("child_process");

const url = new URL(process.env.REDIS_URL || "redis://localhost:6379");
const host = url.hostname || "localhost";
const port = Number(url.port) || 6379;
const isLocal = ["localhost", "127.0.0.1", "::1"].includes(host);

const log = (m) => console.log(`[redis] ${m}`);

function canConnect(timeout = 800) {
  return new Promise((resolve) => {
    const socket = net.connect({ host, port });
    const done = (ok) => { socket.destroy(); resolve(ok); };
    socket.setTimeout(timeout);
    socket.once("connect", () => done(true));
    socket.once("timeout", () => done(false));
    socket.once("error", () => done(false));
  });
}

const run = (cmd, args) =>
  spawnSync(cmd, args, { stdio: "pipe", encoding: "utf8", shell: process.platform === "win32" });

async function waitUntilUp(tries = 20) {
  for (let i = 0; i < tries; i++) {
    if (await canConnect()) return true;
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

(async () => {
  if (await canConnect()) return log(`already running on ${host}:${port}`);

  if (!isLocal) {
    return log(`REDIS_URL points to ${host}:${port}, which is not reachable. Skipping auto-start.`);
  }

  log("not running, starting it...");

  // 1) Docker (service defined in docker-compose.yml)
  if (run("docker", ["--version"]).status === 0) {
    const r = run("docker", ["compose", "up", "-d", "redis"]);
    if (r.status === 0 && (await waitUntilUp())) return log("started with Docker (container: connecto_redis)");
    log(`Docker could not start Redis${r.stderr ? `: ${r.stderr.trim().split("\n").pop()}` : ""}`);
  }

  // 2) Locally installed redis-server
  if (run("redis-server", ["--version"]).status === 0) {
    const r = run("redis-server", ["--port", String(port), "--daemonize", "yes"]);
    if (r.status === 0 && (await waitUntilUp())) return log("started with local redis-server");
  }

  console.warn(
    "[redis] WARNING: could not start Redis automatically. Start Docker Desktop, or install Redis " +
      "(macOS: `brew install redis`), then run `npm run dev` again. Explore posts will not load without it."
  );
})();
