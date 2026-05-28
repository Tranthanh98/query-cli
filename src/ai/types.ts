import type { DatabaseDriver, DriverKind } from "../drivers/types"

export type AiAdapterKind = "anthropic" | "openai" | "openrouter" | "gemini"

export const MAX_AGENT_ITERATIONS = 10

export interface AiJsonSchema {
  type: "object"
  properties: Record<string, AiJsonSchemaProperty>
  required?: string[]
}

export interface AiJsonSchemaProperty {
  type: "string" | "number" | "integer" | "boolean"
  description?: string
}

export interface AiTool {
  name: string
  description: string
  argsSchema: AiJsonSchema
  execute(args: Record<string, unknown>): Promise<unknown>
}

export type AiStatus =
  | { kind: "thinking" }
  | { kind: "tool"; tool: string; args: Record<string, unknown> }

export interface AiRequest {
  prompt: string
  blockContext: string
  driverKind: DriverKind
  tools: AiTool[]
  model: string
  apiKey: string
  onStatus: (s: AiStatus) => void
  signal: AbortSignal
}

export interface AiAdapter {
  readonly kind: AiAdapterKind
  generateSql(req: AiRequest): Promise<string>
}

export interface ToolContext {
  driver: DatabaseDriver
  tables(): Promise<string[]>
  columns(table: string): Promise<{ name: string; type: string; nullable: boolean }[]>
}

export class AiConfigError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "AiConfigError"
  }
}

export class AgentLimitError extends Error {
  constructor(public iterations: number) {
    super(`AI gave up after ${iterations} tool calls`)
    this.name = "AgentLimitError"
  }
}

export class AiRateLimitError extends Error {
  constructor(public cause: unknown) {
    super("AI provider is rate limiting requests")
    this.name = "AiRateLimitError"
  }
}
