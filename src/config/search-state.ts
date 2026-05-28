import { mkdir, readFile, writeFile } from "fs/promises";
import { homedir } from "os";
import { join } from "path";

export interface ConnectionSearchState {
  tableQuery?: string;
  schemaQuery?: string;
  schemaExpanded?: boolean;
}

const CONFIG_DIR = join(homedir(), ".query-cli");
const SEARCH_STATE_FILE = join(CONFIG_DIR, "search-state.json");

export async function loadSearchState(): Promise<Record<string, ConnectionSearchState>> {
  try {
    const data = await readFile(SEARCH_STATE_FILE, "utf8");
    const parsed = JSON.parse(data);
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch (e: any) {
    if (e?.code === "ENOENT") return {};
    throw e;
  }
}

export async function saveSearchState(state: Record<string, ConnectionSearchState>): Promise<void> {
  await mkdir(CONFIG_DIR, { recursive: true });
  await writeFile(SEARCH_STATE_FILE, JSON.stringify(state, null, 2), "utf8");
}
