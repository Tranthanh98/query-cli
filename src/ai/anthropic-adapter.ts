import Anthropic from "@anthropic-ai/sdk"
import { retryOnRateLimit } from "./retry"
import { stripCodeFences } from "./strip-fences"
import {
  AgentLimitError,
  MAX_AGENT_ITERATIONS,
  type AiAdapter,
  type AiRequest,
  type AiTool,
} from "./types"

export class AnthropicAdapter implements AiAdapter {
  readonly kind = "anthropic" as const

  async generateSql(req: AiRequest): Promise<string> {
    const client = new Anthropic({ apiKey: req.apiKey })
    const system = buildSystemPrompt(req.driverKind)
    const tools = req.tools.map(toAnthropicTool)
    const messages: Anthropic.MessageParam[] = [
      { role: "user", content: buildUserContent(req.prompt, req.blockContext) },
    ]

    req.onStatus({ kind: "thinking" })

    for (let i = 0; i < MAX_AGENT_ITERATIONS; i++) {
      if (req.signal.aborted) throw abortError()

      const response = await retryOnRateLimit(
        () =>
          client.messages.create(
            {
              model: req.model,
              max_tokens: 4096,
              system,
              messages,
              tools,
            },
            { signal: req.signal },
          ),
        { signal: req.signal, isRateLimit: isAnthropicRateLimit },
      )

      const toolUses = response.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
      )

      if (toolUses.length === 0) {
        const text = response.content
          .filter((b): b is Anthropic.TextBlock => b.type === "text")
          .map((b) => b.text)
          .join("")
        return stripCodeFences(text)
      }

      messages.push({ role: "assistant", content: response.content })

      const toolResults: Anthropic.ToolResultBlockParam[] = []
      for (const use of toolUses) {
        const tool = req.tools.find((t) => t.name === use.name)
        const args = (use.input as Record<string, unknown>) ?? {}
        req.onStatus({ kind: "tool", tool: use.name, args })
        let result: unknown
        if (!tool) {
          result = { error: `Unknown tool: ${use.name}` }
        } else {
          try {
            result = await tool.execute(args)
          } catch (e) {
            result = { error: e instanceof Error ? e.message : String(e) }
          }
        }
        toolResults.push({
          type: "tool_result",
          tool_use_id: use.id,
          content: JSON.stringify(result),
        })
      }
      messages.push({ role: "user", content: toolResults })
    }
    throw new AgentLimitError(MAX_AGENT_ITERATIONS)
  }
}

function toAnthropicTool(t: AiTool): Anthropic.Tool {
  return {
    name: t.name,
    description: t.description,
    input_schema: t.argsSchema as Anthropic.Tool.InputSchema,
  }
}

function isAnthropicRateLimit(e: unknown): boolean {
  const err = e as { status?: number; error?: { type?: string } }
  return err?.status === 429 || err?.error?.type === "rate_limit_error"
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
