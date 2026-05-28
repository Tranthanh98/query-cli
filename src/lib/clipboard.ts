// OSC52 (terminal escape) only round-trips inside the terminal — most desktop
// clipboards don't receive it. Spawn the OS-native clipboard writer so paste
// works in other apps too.

import { spawn } from "node:child_process";

export function writeClipboard(text: string): Promise<boolean> {
  const cmd = pickClipboardCommand();
  if (!cmd) return Promise.resolve(false);

  return new Promise((resolve) => {
    try {
      const proc = spawn(cmd.command, cmd.args, {
        stdio: ["pipe", "ignore", "ignore"],
        // clip.exe needs a real Win32 child — `shell: false` is correct here.
        shell: false,
      });
      proc.on("error", () => resolve(false));
      proc.on("close", (code) => resolve(code === 0));
      proc.stdin.end(text);
    } catch {
      resolve(false);
    }
  });
}

function pickClipboardCommand():
  | { command: string; args: string[] }
  | null {
  switch (process.platform) {
    case "win32":
      return { command: "clip", args: [] };
    case "darwin":
      return { command: "pbcopy", args: [] };
    case "linux":
      // Prefer wl-copy on Wayland; fall back to xclip. We can't probe here
      // without going async, so just pick xclip — most users have it. Users
      // on pure Wayland can install xclip-wayland or swap this string.
      return { command: "xclip", args: ["-selection", "clipboard"] };
    default:
      return null;
  }
}
