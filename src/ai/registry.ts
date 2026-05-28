import { AnthropicAdapter } from "./anthropic-adapter"
import { GeminiAdapter } from "./gemini-adapter"
import { OpenAiCompatibleAdapter } from "./openai-compatible-adapter"
import type { AiAdapter, AiAdapterKind } from "./types"

const registry: Record<AiAdapterKind, () => AiAdapter> = {
  anthropic: () => new AnthropicAdapter(),
  openai: () => new OpenAiCompatibleAdapter({ kind: "openai" }),
  openrouter: () =>
    new OpenAiCompatibleAdapter({
      kind: "openrouter",
      baseURL: "https://openrouter.ai/api/v1",
      extraHeaders: {
        "HTTP-Referer": "query-cli",
        "X-Title": "query-cli",
      },
    }),
  gemini: () => new GeminiAdapter(),
}

export const AVAILABLE_AI_ADAPTERS: AiAdapterKind[] = [
  "anthropic",
  "openai",
  "openrouter",
  "gemini",
]

export function createAiAdapter(kind: AiAdapterKind): AiAdapter {
  const factory = registry[kind]
  if (!factory) throw new Error(`Unknown AI adapter: ${kind}`)
  return factory()
}
