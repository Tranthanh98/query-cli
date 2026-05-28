import { mkdir, readFile, writeFile } from "fs/promises";
import { join } from "path";
import type { ConnectionConfig } from "../drivers/types";
import { CONFIG_DIR } from "./dir";

const CONFIG_FILE = join(CONFIG_DIR, "connections.json");

export async function loadConnections(): Promise<ConnectionConfig[]> {
  try {
    const data = await readFile(CONFIG_FILE, "utf8");
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e: any) {
    if (e?.code === "ENOENT") return [];
    throw e;
  }
}

export async function saveConnection(conn: ConnectionConfig): Promise<void> {
  await mkdir(CONFIG_DIR, { recursive: true });
  const all = await loadConnections();
  const idx = all.findIndex((c) => c.id === conn.id);
  if (idx >= 0) all[idx] = conn;
  else all.push(conn);
  await writeFile(CONFIG_FILE, JSON.stringify(all, null, 2), "utf8");
}

export async function deleteConnection(id: string): Promise<void> {
  const all = await loadConnections();
  const next = all.filter((c) => c.id !== id);
  await mkdir(CONFIG_DIR, { recursive: true });
  await writeFile(CONFIG_FILE, JSON.stringify(next, null, 2), "utf8");
}

export function newConnectionId(): string {
  return `conn_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
