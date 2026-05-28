import OpenAI from "openai"
import { retryOnRateLimit } from "./retry"
import { stripCodeFences } from "./strip-fences"
import {
  AgentLimitError,
  MAX_AGENT_ITERATIONS,
  type AiAdapter,
  type AiAdapterKind,
  type AiRequest,
  type AiTool,
} from "./types"

export interface OpenAiCompatibleConfig {
  kind: AiAdapterKind
  baseURL?: string
  extraHeaders?: Record<string, string>
}

export class OpenAiCompatibleAdapter implements AiAdapter {
  readonly kind: AiAdapterKind
  private baseURL?: string
  private extraHeaders?: Record<string, string>

  constructor(config: OpenAiCompatibleConfig) {
    this.kind = config.kind
    this.baseURL = config.baseURL
    this.extraHeaders = config.extraHeaders
  }

  async generateSql(req: AiRequest): Promise<string> {
    const client = new OpenAI({
      apiKey: req.apiKey,
      baseURL: this.baseURL,
      defaultHeaders: this.extraHeaders,
    })

    const system = buildSystemPrompt(req.driverKind)
    const tools = req.tools.map(toOpenAiTool)
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: system },
      { role: "user", content: buildUserContent(req.prompt, req.blockContext) },
    ]

    req.onStatus({ kind: "thinking" })

    for (let i = 0; i < MAX_AGENT_ITERATIONS; i++) {
      if (req.signal.aborted) throw abortError()

      const response = await retryOnRateLimit(
        () =>
          client.chat.completions.create(
            { model: req.model, messages, tools, max_tokens: 4096 },
            { signal: req.signal },
          ),
        { signal: req.signal, isRateLimit: isOpenAiRateLimit },
      )

      const choice = response.choices[0]
      if (!choice) throw new Error("OpenAI response had no choices")
      const message = choice.message
      const toolCalls = message.tool_calls ?? []

      if (toolCalls.length === 0) {
        return stripCodeFences(message.content ?? "")
      }

      messages.push(message)

      for (const call of toolCalls) {
        if (call.type !== "function") continue
        const tool = req.tools.find((t) => t.name === call.function.name)
        let parsed: Record<string, unknown> = {}
        try {
          parsed = JSON.parse(call.function.arguments) as Record<string, unknown>
        } catch {
          parsed = {}
        }
        req.onStatus({ kind: "tool", tool: call.function.name, args: parsed })
        let result: unknown
        if (!tool) {
          result = { error: `Unknown tool: ${call.function.name}` }
        } else {
          try {
            result = await tool.execute(parsed)
          } catch (e) {
            result = { error: e instanceof Error ? e.message : String(e) }
          }
        }
        messages.push({
          role: "tool",
          tool_call_id: call.id,
          content: JSON.stringify(result),
        })
      }
    }
    throw new AgentLimitError(MAX_AGENT_ITERATIONS)
  }
}

function toOpenAiTool(t: AiTool): OpenAI.Chat.ChatCompletionTool {
  return {
    type: "function",
    function: {
      name: t.name,
      description: t.description,
      parameters: t.argsSchema as unknown as Record<string, unknown>,
    },
  }
}

function isOpenAiRateLimit(e: unknown): boolean {
  const err = e as { status?: number; code?: string }
  return err?.status === 429 || err?.code === "rate_limit_exceeded"
}

function buildSystemPrompt(driverKind: string): string {
  return `You are a SQL assistant for a ${driverKind} database. Generate a single SQL query that answers the user's request. Use the provided tools to discover the schema — do not assume column names. Return only the SQL, with no explanations and no markdown code fences.`
}

function buildUserContent(prompt: string, blockContext: string): string {
  if (!blockContext) return `User request: ${prompt}`
  return `User request: ${prompt}\n\nExisting SQL in the editor (for context, may be incomplete):\n${blockContext}`
}

function abortError(): DOMException {
  return new DOMException("Aborted", "AbortError")
}
