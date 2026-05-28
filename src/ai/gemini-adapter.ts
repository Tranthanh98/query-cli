import { GoogleGenAI, type Content, type Part } from "@google/genai"
import { retryOnRateLimit } from "./retry"
import { stripCodeFences } from "./strip-fences"
import {
  AgentLimitError,
  MAX_AGENT_ITERATIONS,
  type AiAdapter,
  type AiRequest,
  type AiTool,
} from "./types"

export class GeminiAdapter implements AiAdapter {
  readonly kind = "gemini" as const

  async generateSql(req: AiRequest): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: req.apiKey })
    const tools = [{ functionDeclarations: req.tools.map(toGeminiDeclaration) }]
    const system = buildSystemPrompt(req.driverKind)
    const contents: Content[] = [
      { role: "user", parts: [{ text: buildUserContent(req.prompt, req.blockContext) }] },
    ]

    req.onStatus({ kind: "thinking" })

    for (let i = 0; i < MAX_AGENT_ITERATIONS; i++) {
      if (req.signal.aborted) throw abortError()

      const response = await retryOnRateLimit(
        () =>
          ai.models.generateContent({
            model: req.model,
            contents,
            config: {
              systemInstruction: system,
              tools,
              abortSignal: req.signal,
            },
          }),
        { signal: req.signal, isRateLimit: isGeminiRateLimit },
      )

      const parts: Part[] = response.candidates?.[0]?.content?.parts ?? []
      const funcCalls = parts.filter((p): p is Part & { functionCall: NonNullable<Part["functionCall"]> } =>
        p.functionCall != null,
      )

      if (funcCalls.length === 0) {
        const text = parts
          .filter((p): p is Part & { text: string } => typeof p.text === "string")
          .map((p) => p.text)
          .join("")
        return stripCodeFences(text)
      }

      contents.push({ role: "model", parts })

      const responseParts: Part[] = []
      for (const fc of funcCalls) {
        const name = fc.functionCall.name ?? ""
        const args = fc.functionCall.args ?? {}
        const tool = req.tools.find((t) => t.name === name)
        req.onStatus({ kind: "tool", tool: name, args })
        let result: unknown
        if (!tool) {
          result = { error: `Unknown tool: ${name}` }
        } else {
          try {
            result = await tool.execute(args)
          } catch (e) {
            result = { error: e instanceof Error ? e.message : String(e) }
          }
        }
        responseParts.push({
          functionResponse: {
            name,
            response: { result },
          },
        })
      }
      contents.push({ role: "user", parts: responseParts })
    }
    throw new AgentLimitError(MAX_AGENT_ITERATIONS)
  }
}

function toGeminiDeclaration(t: AiTool) {
  return {
    name: t.name,
    description: t.description,
    parametersJsonSchema: t.argsSchema,
  }
}

function isGeminiRateLimit(e: unknown): boolean {
  const err = e as { status?: number; message?: string }
  if (err?.status === 429) return true
  const msg = err?.message ?? ""
  return msg.includes("RESOURCE_EXHAUSTED") || msg.includes("429")
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
