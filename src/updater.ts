import { chmod, rename, unlink } from "node:fs/promises";
import { existsSync } from "node:fs";

// Inline version so it survives bun build --compile.
import packageJson from "../package.json" with { type: "json" };

const CURRENT_VERSION = packageJson.version;
const REPO = "Tranthanh98/query-cli";
const GITHUB_API_URL = `https://api.github.com/repos/${REPO}/releases/latest`;

function getPlatformAssetName(): string {
  const ext = process.platform === "win32" ? ".exe" : "";
  return `query-cli-${process.platform}-${process.arch}${ext}`;
}

function isCompiledBinary(): boolean {
  const exe = process.execPath;
  return !exe.endsWith("/bun") && !exe.endsWith("\\bun.exe");
}

function getCurrentBinaryPath(): string {
  // When running a standalone compiled binary, process.execPath is the binary itself.
  // When running via `bun run`, it points to the bun executable.
  return isCompiledBinary() ? process.execPath : "";
}

function parseVersion(tag: string): string {
  return tag.replace(/^v/, "");
}

function compareVersions(a: string, b: string): number {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const na = pa[i] ?? 0;
    const nb = pb[i] ?? 0;
    if (na > nb) return 1;
    if (na < nb) return -1;
  }
  return 0;
}

export interface UpdateInfo {
  currentVersion: string;
  latestVersion: string;
  downloadUrl: string;
  releaseUrl: string;
}

export async function checkForUpdate(): Promise<UpdateInfo | null> {
  try {
    const res = await fetch(GITHUB_API_URL, {
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "query-cli-updater",
      },
    });
    if (!res.ok) return null;

    const data = (await res.json()) as {
      tag_name: string;
      html_url: string;
      assets?: Array<{ name: string; browser_download_url: string }>;
    };

    const latestVersion = parseVersion(data.tag_name);
    if (compareVersions(CURRENT_VERSION, latestVersion) >= 0) return null;

    const assetName = getPlatformAssetName();
    const asset = data.assets?.find((a) => a.name === assetName);
    if (!asset) return null;

    return {
      currentVersion: CURRENT_VERSION,
      latestVersion,
      downloadUrl: asset.browser_download_url,
      releaseUrl: data.html_url,
    };
  } catch {
    return null;
  }
}

async function downloadBinary(url: string): Promise<Uint8Array> {
  const res = await fetch(url, {
    headers: { "User-Agent": "query-cli-updater" },
  });
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  const buffer = await res.arrayBuffer();
  return new Uint8Array(buffer);
}

async function applyUpdate(info: UpdateInfo): Promise<void> {
  const currentPath = getCurrentBinaryPath();
  if (!currentPath) {
    throw new Error("Cannot self-update when running via bun run. Please use the compiled binary.");
  }

  const bytes = await downloadBinary(info.downloadUrl);
  const tmpPath = currentPath + ".update";

  if (process.platform === "win32") {
    // Windows locks the running .exe. Write the new binary next to it,
    // then spawn a detached PowerShell script that waits a moment and swaps
    // the files after we exit.
    await Bun.write(tmpPath, bytes);

    const psPath = tmpPath + ".ps1";
    const psScript = `
Start-Sleep -Seconds 2
Move-Item -Path "${tmpPath}" -Destination "${currentPath}" -Force
Remove-Item -Path "${psPath}" -Force
`;
    await Bun.write(psPath, psScript);

    Bun.spawn(
      [
        "powershell",
        "-WindowStyle", "Hidden",
        "-ExecutionPolicy", "Bypass",
        "-File", psPath,
      ],
      {
        detached: true,
        stdout: "ignore",
        stderr: "ignore",
        stdin: "ignore",
      },
    );
  } else {
    // macOS / Linux: we can overwrite the running binary directly.
    await Bun.write(currentPath, bytes);
    try {
      await chmod(currentPath, 0o755);
    } catch {
      // best-effort
    }
    // Remove temp file if it exists from a previous failed attempt
    if (existsSync(tmpPath)) {
      try { await unlink(tmpPath); } catch {}
    }
  }
}

export async function performUpdate(info: UpdateInfo): Promise<void> {
  await applyUpdate(info);
  // Force exit so the new binary is used on the next launch.
  process.exit(0);
}
