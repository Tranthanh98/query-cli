import { mkdir, readFile, writeFile } from "fs/promises"
import { join } from "path"
import { CONFIG_DIR } from "../config/dir"
import type { AiAdapterKind } from "./types"

const AI_CONFIG_FILE = join(CONFIG_DIR, "ai.json")

export interface AiConfig {
  adapter: AiAdapterKind
  model: string
  apiKeys?: Partial<Record<AiAdapterKind, string>>
}

export async function loadAiConfig(): Promise<AiConfig | null> {
  try {
    const data = await readFile(AI_CONFIG_FILE, "utf8")
    const parsed = JSON.parse(data) as AiConfig
    if (!parsed.adapter || !parsed.model) return null
    return parsed
  } catch (e: any) {
    if (e?.code === "ENOENT") return null
    throw e
  }
}

export function resolveApiKey(config: AiConfig): string | null {
  const stored = config.apiKeys?.[config.adapter]
  if (stored && stored.length > 0) return stored
  return loadApiKey(config.adapter)
}

export function hasConfiguredKey(
  adapter: AiAdapterKind,
  config: AiConfig | null,
): "stored" | "env" | "none" {
  if (config?.apiKeys?.[adapter]) return "stored"
  if (loadApiKey(adapter)) return "env"
  return "none"
}

export async function saveAiConfig(cfg: AiConfig): Promise<void> {
  await mkdir(CONFIG_DIR, { recursive: true })
  await writeFile(AI_CONFIG_FILE, JSON.stringify(cfg, null, 2), "utf8")
}

export const DEFAULT_MODELS: Record<AiAdapterKind, string> = {
  anthropic: "claude-sonnet-4-6",
  openai: "gpt-4o-mini",
  openrouter: "meta-llama/llama-3.3-70b-instruct:free",
  gemini: "gemini-2.5-flash",
}

const ENV_BY_ADAPTER: Record<AiAdapterKind, string[]> = {
  anthropic: ["ANTHROPIC_API_KEY"],
  openai: ["OPENAI_API_KEY"],
  openrouter: ["OPENROUTER_API_KEY"],
  gemini: ["GEMINI_API_KEY", "GOOGLE_API_KEY"],
}

export function loadApiKey(adapter: AiAdapterKind): string | null {
  for (const name of ENV_BY_ADAPTER[adapter]) {
    const v = process.env[name]
    if (v && v.length > 0) return v
  }
  return null
}

export function envVarHint(adapter: AiAdapterKind): string {
  return ENV_BY_ADAPTER[adapter][0]!
}
