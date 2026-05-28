import { mkdir, readFile, writeFile } from "fs/promises";
import { homedir } from "os";
import { join } from "path";

export interface SavedQuery {
  id: string;
  name: string;
  text: string;
  /** Connection this query belongs to. Undefined for legacy queries saved
   *  before per-connection scoping. */
  connectionId?: string;
}

const CONFIG_DIR = join(homedir(), ".query-cli");
const CONFIG_FILE = join(CONFIG_DIR, "queries.json");

export async function loadQueries(): Promise<SavedQuery[]> {
  try {
    const data = await readFile(CONFIG_FILE, "utf8");
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e: any) {
    if (e?.code === "ENOENT") return [];
    throw e;
  }
}

export async function saveQueries(queries: SavedQuery[]): Promise<void> {
  await mkdir(CONFIG_DIR, { recursive: true });
  await writeFile(CONFIG_FILE, JSON.stringify(queries, null, 2), "utf8");
}

export function newQueryId(): string {
  return `q_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
