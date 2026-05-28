#!/usr/bin/env node
// Launcher for the published `query-cli` package.
//
// `query-cli` ships no runnable JS of its own — the real program is a standalone
// binary compiled with `bun build --compile` (Bun runtime + OpenTUI native libs
// embedded). One binary per platform is published as a separate package and wired
// up via optionalDependencies, so npm/pnpm/yarn install only the matching one.
//
// This launcher runs on plain Node (no Bun required), resolves the binary for the
// current platform, and re-execs it with the user's args and the real TTY.
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { chmodSync } from "node:fs";

const require = createRequire(import.meta.url);

const platformKey = `${process.platform}-${process.arch}`;
const pkgName = `query-cli-${platformKey}`;
const binName = process.platform === "win32" ? "query-cli.exe" : "query-cli";

let binPath;
try {
  binPath = require.resolve(`${pkgName}/bin/${binName}`);
} catch {
  console.error(
    `query-cli: no prebuilt binary for this platform (${platformKey}).\n` +
      `The optional dependency "${pkgName}" was not installed.\n` +
      `Supported: linux-x64, linux-arm64, darwin-x64, darwin-arm64, win32-x64.\n` +
      `If your platform is supported, reinstall without --no-optional / --ignore-optional.`,
  );
  process.exit(1);
}

// npm usually preserves the executable bit, but pnpm/yarn extraction can drop it.
if (process.platform !== "win32") {
  try {
    chmodSync(binPath, 0o755);
  } catch {
    // best-effort; if it's already executable this is a no-op
  }
}

const { status, signal, error } = spawnSync(binPath, process.argv.slice(2), {
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
