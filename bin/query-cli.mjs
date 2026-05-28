#!/usr/bin/env node
// Launcher for the published `query-cli` package.
//
// `query-cli` ships no runnable JS of its own — the real program is a standalone
// binary compiled with `bun build --compile` (Bun runtime + OpenTUI native libs
// embedded). One binary per platform is published as a GitHub Release asset.
//
// This launcher runs on plain Node (no Bun required). On first run it downloads
// the correct binary for the current platform into `~/.cache/query-cli/`, then
// re-execs it with the user's args and the real TTY.
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  renameSync,
  createWriteStream,
} from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import https from "node:https";

const require = createRequire(import.meta.url);
let version = process.env.QUERY_CLI_VERSION;
if (!version) {
  try {
    version = require("../package.json").version;
  } catch {
    version = "0.0.0";
  }
}
if (version === "0.0.0") {
  console.error(
    "query-cli: version is 0.0.0. If you're testing locally, set QUERY_CLI_VERSION\n" +
      "to a released version, e.g. QUERY_CLI_VERSION=0.1.0 node bin/query-cli.mjs",
  );
  process.exit(1);
}

const platformKey = `${process.platform}-${process.arch}`;
const ext = process.platform === "win32" ? ".exe" : "";
const binName = `query-cli${ext}`;

const supported = [
  "linux-x64",
  "linux-arm64",
  "darwin-x64",
  "darwin-arm64",
  "win32-x64",
];
if (!supported.includes(platformKey)) {
  console.error(
    `query-cli: no prebuilt binary for this platform (${platformKey}).\n` +
      `Supported: ${supported.join(", ")}.\n` +
      `If you need support for another platform, please open an issue at:\n` +
      `https://github.com/Tranthanh98/query-cli/issues`,
  );
  process.exit(1);
}

const cacheDir = path.join(homedir(), ".cache", "query-cli");
const cachedBin = path.join(
  cacheDir,
  `${binName}-${version}-${platformKey}${ext}`,
);

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = createWriteStream(dest);
    https
      .get(url, { headers: { "User-Agent": "query-cli" } }, (res) => {
        if (
          res.statusCode >= 300 &&
          res.statusCode < 400 &&
          res.headers.location
        ) {
          // Follow single redirect (GitHub Releases -> objects.githubusercontent.com)
          https
            .get(
              res.headers.location,
              { headers: { "User-Agent": "query-cli" } },
              (res2) => {
                if (res2.statusCode !== 200) {
                  reject(
                    new Error(`Download failed with status ${res2.statusCode}`),
                  );
                  return;
                }
                res2.pipe(file);
                file.on("finish", () => {
                  file.close();
                  resolve();
                });
              },
            )
            .on("error", reject);
        } else if (res.statusCode === 200) {
          res.pipe(file);
          file.on("finish", () => {
            file.close();
            resolve();
          });
        } else {
          reject(new Error(`Download failed with status ${res.statusCode}`));
        }
      })
      .on("error", reject);
  });
}

if (!existsSync(cachedBin)) {
  mkdirSync(cacheDir, { recursive: true });
  const url = `https://github.com/Tranthanh98/query-cli/releases/download/v${version}/query-cli-${platformKey}${ext}`;

  console.error(
    `query-cli: downloading binary for ${platformKey} v${version}...`,
  );

  const tmpPath = cachedBin + ".tmp";
  try {
    await download(url, tmpPath);
    renameSync(tmpPath, cachedBin);
  } catch (err) {
    console.error(`query-cli: failed to download binary.\n${err.message}`);
    process.exit(1);
  }
}

// npm usually preserves the executable bit, but the cache file may not have it.
if (process.platform !== "win32") {
  try {
    chmodSync(cachedBin, 0o755);
  } catch {
    // best-effort; if it's already executable this is a no-op
  }
}

const { status, signal, error } = spawnSync(cachedBin, process.argv.slice(2), {
  stdio: "inherit",
});

if (error) {
  console.error(error);
  process.exit(1);
}
if (signal) {
  // Re-raise the signal so the parent shell sees the right termination cause.
  process.kill(process.pid, signal);
}
process.exit(status ?? 0);
