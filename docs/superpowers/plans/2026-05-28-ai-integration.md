# AI Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users type `@ai: <question>` in the query editor and run it to have an AI generate SQL that replaces the prompt block; AI agent has tool access to live schema introspection.

**Architecture:** Provider-pluggable `AiAdapter` interface (parallels existing `DatabaseDriver` pattern). Phase 1 ships four adapters: Anthropic, OpenAI, OpenRouter (sharing a class with OpenAI), and Gemini. Each adapter runs its own agent loop using its provider's native tool-calling API — no agent framework, no MCP. Tools (`list_tables`, `get_columns`, `search_tables`, `sample_rows`) are pure functions over the existing `DatabaseDriver` + `SchemaContext`.

**Tech Stack:** Bun + TypeScript + React (OpenTUI). New deps: `@anthropic-ai/sdk`, `openai`, `@google/genai`. Built-in `bun:test` runner for pure-function tests. No new build tooling.

**Spec:** [docs/superpowers/specs/2026-05-28-ai-integration-design.md](docs/superpowers/specs/2026-05-28-ai-integration-design.md)

---

## File Structure

**New files (in dependency order):**

| File | Responsibility |
|---|---|
| `src/config/dir.ts` | Shared `CONFIG_DIR = ~/.query-cli/` constant |
| `src/ai/types.ts` | `AiAdapter`, `AiTool`, `AiStatus`, `AiRequest`, `AiAdapterKind`, `MAX_AGENT_ITERATIONS`, error classes |
| `src/ai/extract-ai-prompt.ts` | Pure function that finds `@ai:` line in a block + returns prompt/context/range |
| `src/ai/strip-fences.ts` | Strips ` ```sql `/` ``` ` fences from model output |
| `src/ai/retry.ts` | `retryOnRateLimit` with exp backoff, AbortSignal-aware |
| `src/ai/config.ts` | `loadAiConfig` / `saveAiConfig` / `loadApiKey(adapter)` |
| `src/ai/tools.ts` | `makeSchemaTools(ctx)` factory producing the four `AiTool`s |
| `src/ai/anthropic-adapter.ts` | Anthropic Messages API + tool-use loop |
| `src/ai/openai-compatible-adapter.ts` | OpenAI Chat Completions + tool-call loop; serves `openai` and `openrouter` kinds |
| `src/ai/gemini-adapter.ts` | Gemini `generateContent` + functionCall loop |
| `src/ai/registry.ts` | `createAiAdapter(kind)` factory with pre-configured presets |
| `src/ai-context.tsx` | React provider wiring driver + schema + adapter |
| `src/screens/ai-config-modal.tsx` | Two-step modal: adapter select → model input |

**Test files (pure functions only):**

| File | Covers |
|---|---|
| `src/ai/extract-ai-prompt.test.ts` | Trigger detection edge cases |
| `src/ai/strip-fences.test.ts` | Fence stripping variants |
| `src/ai/retry.test.ts` | Retry + backoff + abort behaviour |
| `src/ai/tools.test.ts` | Tool dispatch over a fake `ToolContext` |

**Modified files:**

| File | Change |
|---|---|
| `src/config/connections.ts` | Import `CONFIG_DIR` from `src/config/dir.ts` |
| `src/components/sql/sql-tokens.ts` | New `"ai-directive"` token type; emit when `@ai:` starts a line |
| `src/components/sql/sql-syntax.ts` | Style for `"ai-directive"` |
| `src/screens/main.tsx` | Detect `@ai:` block on submit, route to AI; add `/ai-config` slash command; Esc cancel |
| `package.json` | Add `@anthropic-ai/sdk`, `openai`, `@google/genai` |

---

## Task 1: Add dependencies and extract `CONFIG_DIR`

**Files:**
- Create: `src/config/dir.ts`
- Modify: `src/config/connections.ts`
- Modify: `package.json`

- [ ] **Step 1.1: Install new dependencies**

Run:
```bash
bun add @anthropic-ai/sdk openai @google/genai
```

Expected: three packages added to `dependencies` in `package.json`; `bun.lockb` updated.

- [ ] **Step 1.2: Create `src/config/dir.ts`**

```ts
import { homedir } from "os"
import { join } from "path"

export const CONFIG_DIR = join(homedir(), ".query-cli")
```

- [ ] **Step 1.3: Refactor `src/config/connections.ts` to use the shared constant**

Replace the top of the file:
```ts
import { mkdir, readFile, writeFile } from "fs/promises"
import { join } from "path"
import type { ConnectionConfig } from "../drivers/types"
import { CONFIG_DIR } from "./dir"

const CONFIG_FILE = join(CONFIG_DIR, "connections.json")
```

Remove the now-unused `homedir` import. The rest of the file is unchanged.

- [ ] **Step 1.4: Typecheck**

Run: `bun run typecheck`
Expected: exit 0.

- [ ] **Step 1.5: Commit**

```bash
git add package.json bun.lockb src/config/dir.ts src/config/connections.ts
git commit -m "chore: add AI SDK deps and extract shared CONFIG_DIR"
```

---

## Task 2: Define `AiAdapter` types and constants

**Files:**
- Create: `src/ai/types.ts`

- [ ] **Step 2.1: Create `src/ai/types.ts` with the full type surface**

```ts
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
```

- [ ] **Step 2.2: Typecheck**

Run: `bun run typecheck`
Expected: exit 0.

- [ ] **Step 2.3: Commit**

```bash
git add src/ai/types.ts
git commit -m "feat: add AiAdapter type surface"
```

---

## Task 3: `extractAiPrompt` pure function + tests

**Files:**
- Create: `src/ai/extract-ai-prompt.ts`
- Create: `src/ai/extract-ai-prompt.test.ts`

- [ ] **Step 3.1: Write the failing test**

`src/ai/extract-ai-prompt.test.ts`:
```ts
import { test, expect } from "bun:test"
import { extractAiPrompt } from "./extract-ai-prompt"

test("returns null when no @ai: line present", () => {
  expect(extractAiPrompt("SELECT 1", 0)).toBeNull()
})

test("detects a bare @ai: line", () => {
  const text = "@ai: list active users"
  const result = extractAiPrompt(text, 0)
  expect(result).toEqual({
    prompt: "list active users",
    blockContext: "",
    range: { start: 0, end: text.length },
  })
})

test("detects @ai: with leading whitespace", () => {
  const text = "  @ai: count rows"
  const result = extractAiPrompt(text, 0)
  expect(result?.prompt).toBe("count rows")
})

test("captures surrounding SQL as blockContext and includes it in range", () => {
  const text = "SELECT id FROM users\n@ai: also include email"
  const result = extractAiPrompt(text, 0)
  expect(result?.prompt).toBe("also include email")
  expect(result?.blockContext).toBe("SELECT id FROM users")
  expect(result?.range).toEqual({ start: 0, end: text.length })
})

test("uses the first @ai: when multiple are present", () => {
  const text = "@ai: first\n@ai: second"
  const result = extractAiPrompt(text, 0)
  expect(result?.prompt).toBe("first")
  expect(result?.blockContext).toBe("@ai: second")
})

test("range is offset by blockStart", () => {
  const text = "@ai: x"
  const result = extractAiPrompt(text, 42)
  expect(result?.range).toEqual({ start: 42, end: 42 + text.length })
})

test("trims trailing whitespace from prompt", () => {
  expect(extractAiPrompt("@ai:   hello   ", 0)?.prompt).toBe("hello")
})
```

- [ ] **Step 3.2: Run tests — confirm failure**

Run: `bun test src/ai/extract-ai-prompt.test.ts`
Expected: FAIL with "Cannot find module './extract-ai-prompt'".

- [ ] **Step 3.3: Implement `src/ai/extract-ai-prompt.ts`**

```ts
export interface AiPromptMatch {
  prompt: string
  blockContext: string
  range: { start: number; end: number }
}

export function extractAiPrompt(
  blockText: string,
  blockStart: number,
): AiPromptMatch | null {
  const lines = blockText.split("\n")
  let aiLineIdx = -1
  let promptText = ""
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i]!.trimStart()
    if (trimmed.startsWith("@ai:")) {
      aiLineIdx = i
      promptText = trimmed.slice("@ai:".length).trim()
      break
    }
  }
  if (aiLineIdx === -1) return null
  const blockContext = lines
    .filter((_, i) => i !== aiLineIdx)
    .join("\n")
    .trim()
  return {
    prompt: promptText,
    blockContext,
    range: { start: blockStart, end: blockStart + blockText.length },
  }
}
```

- [ ] **Step 3.4: Run tests — confirm pass**

Run: `bun test src/ai/extract-ai-prompt.test.ts`
Expected: 7 pass, 0 fail.

- [ ] **Step 3.5: Commit**

```bash
git add src/ai/extract-ai-prompt.ts src/ai/extract-ai-prompt.test.ts
git commit -m "feat: add extractAiPrompt with tests"
```

---

## Task 4: `stripCodeFences` helper + tests

**Files:**
- Create: `src/ai/strip-fences.ts`
- Create: `src/ai/strip-fences.test.ts`

- [ ] **Step 4.1: Write the failing test**

`src/ai/strip-fences.test.ts`:
```ts
import { test, expect } from "bun:test"
import { stripCodeFences } from "./strip-fences"

test("returns plain text unchanged", () => {
  expect(stripCodeFences("SELECT 1")).toBe("SELECT 1")
})

test("strips ```sql ... ``` fence", () => {
  expect(stripCodeFences("```sql\nSELECT 1\n```")).toBe("SELECT 1")
})

test("strips ``` ... ``` fence without language", () => {
  expect(stripCodeFences("```\nSELECT 1\n```")).toBe("SELECT 1")
})

test("trims surrounding whitespace", () => {
  expect(stripCodeFences("  \n\nSELECT 1\n  ")).toBe("SELECT 1")
})

test("preserves inner newlines", () => {
  expect(stripCodeFences("```sql\nSELECT *\nFROM t\n```")).toBe("SELECT *\nFROM t")
})

test("handles fence on same line as content", () => {
  expect(stripCodeFences("```sql SELECT 1 ```")).toBe("SELECT 1")
})
```

- [ ] **Step 4.2: Run tests — confirm failure**

Run: `bun test src/ai/strip-fences.test.ts`
Expected: FAIL with module-not-found.

- [ ] **Step 4.3: Implement `src/ai/strip-fences.ts`**

```ts
export function stripCodeFences(text: string): string {
  let s = text.trim()
  const fenceMatch = s.match(/^```(?:sql)?\s*([\s\S]*?)\s*```$/i)
  if (fenceMatch) s = fenceMatch[1]!
  return s.trim()
}
```

- [ ] **Step 4.4: Run tests — confirm pass**

Run: `bun test src/ai/strip-fences.test.ts`
Expected: 6 pass, 0 fail.

- [ ] **Step 4.5: Commit**

```bash
git add src/ai/strip-fences.ts src/ai/strip-fences.test.ts
git commit -m "feat: add stripCodeFences helper"
```

---

## Task 5: `retryOnRateLimit` helper + tests

**Files:**
- Create: `src/ai/retry.ts`
- Create: `src/ai/retry.test.ts`

- [ ] **Step 5.1: Write the failing test**

`src/ai/retry.test.ts`:
```ts
import { test, expect } from "bun:test"
import { retryOnRateLimit } from "./retry"

const noopSignal = new AbortController().signal
const isRateLimit = (e: unknown) => (e as { code?: string })?.code === "RATE_LIMIT"

test("returns value on first success", async () => {
  let calls = 0
  const result = await retryOnRateLimit(
    async () => { calls++; return 42 },
    { signal: noopSignal, isRateLimit, sleep: async () => {} },
  )
  expect(result).toBe(42)
  expect(calls).toBe(1)
})

test("retries on rate-limit error then succeeds", async () => {
  let calls = 0
  const result = await retryOnRateLimit(
    async () => {
      calls++
      if (calls < 3) throw { code: "RATE_LIMIT" }
      return "ok"
    },
    { signal: noopSignal, isRateLimit, sleep: async () => {} },
  )
  expect(result).toBe("ok")
  expect(calls).toBe(3)
})

test("gives up after 3 retries", async () => {
  let calls = 0
  const err = { code: "RATE_LIMIT" }
  await expect(
    retryOnRateLimit(
      async () => { calls++; throw err },
      { signal: noopSignal, isRateLimit, sleep: async () => {} },
    ),
  ).rejects.toBe(err)
  expect(calls).toBe(4) // 1 initial + 3 retries
})

test("non-rate-limit errors are not retried", async () => {
  let calls = 0
  const err = new Error("network down")
  await expect(
    retryOnRateLimit(
      async () => { calls++; throw err },
      { signal: noopSignal, isRateLimit, sleep: async () => {} },
    ),
  ).rejects.toBe(err)
  expect(calls).toBe(1)
})

test("aborts before sleeping", async () => {
  const controller = new AbortController()
  let calls = 0
  controller.abort()
  await expect(
    retryOnRateLimit(
      async () => { calls++; throw { code: "RATE_LIMIT" } },
      { signal: controller.signal, isRateLimit, sleep: async () => {} },
    ),
  ).rejects.toMatchObject({ name: "AbortError" })
  expect(calls).toBe(1)
})

test("uses exponential backoff delays", async () => {
  const delays: number[] = []
  let calls = 0
  await expect(
    retryOnRateLimit(
      async () => { calls++; throw { code: "RATE_LIMIT" } },
      {
        signal: noopSignal,
        isRateLimit,
        sleep: async (ms: number) => { delays.push(ms) },
      },
    ),
  ).rejects.toBeDefined()
  expect(delays).toEqual([1000, 2000, 4000])
})
```

- [ ] **Step 5.2: Run tests — confirm failure**

Run: `bun test src/ai/retry.test.ts`
Expected: FAIL with module-not-found.

- [ ] **Step 5.3: Implement `src/ai/retry.ts`**

```ts
export interface RetryOptions {
  signal: AbortSignal
  isRateLimit: (e: unknown) => boolean
  sleep?: (ms: number) => Promise<void>
}

const DELAYS_MS = [1000, 2000, 4000]

export async function retryOnRateLimit<T>(
  fn: () => Promise<T>,
  opts: RetryOptions,
): Promise<T> {
  const sleep = opts.sleep ?? defaultSleep
  let lastErr: unknown
  for (let attempt = 0; attempt <= DELAYS_MS.length; attempt++) {
    if (opts.signal.aborted) throw abortError()
    try {
      return await fn()
    } catch (e) {
      lastErr = e
      if (!opts.isRateLimit(e)) throw e
      if (attempt === DELAYS_MS.length) throw e
      await sleep(DELAYS_MS[attempt]!)
    }
  }
  throw lastErr
}

function defaultSleep(ms: number): Promise<void> {
  return new Promise((res) => setTimeout(res, ms))
}

function abortError(): DOMException {
  return new DOMException("Aborted", "AbortError")
}
```

- [ ] **Step 5.4: Run tests — confirm pass**

Run: `bun test src/ai/retry.test.ts`
Expected: 6 pass, 0 fail.

- [ ] **Step 5.5: Commit**

```bash
git add src/ai/retry.ts src/ai/retry.test.ts
git commit -m "feat: add retryOnRateLimit with exponential backoff"
```

---

## Task 6: AI config loader

**Files:**
- Create: `src/ai/config.ts`

- [ ] **Step 6.1: Implement `src/ai/config.ts`**

```ts
import { mkdir, readFile, writeFile } from "fs/promises"
import { join } from "path"
import { CONFIG_DIR } from "../config/dir"
import type { AiAdapterKind } from "./types"

const AI_CONFIG_FILE = join(CONFIG_DIR, "ai.json")

export interface AiConfig {
  adapter: AiAdapterKind
  model: string
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

export async function saveAiConfig(cfg: AiConfig): Promise<void> {
  await mkdir(CONFIG_DIR, { recursive: true })
  await writeFile(AI_CONFIG_FILE, JSON.stringify(cfg, null, 2), "utf8")
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
```

- [ ] **Step 6.2: Typecheck**

Run: `bun run typecheck`
Expected: exit 0.

- [ ] **Step 6.3: Commit**

```bash
git add src/ai/config.ts
git commit -m "feat: add AI config loader and env-var API key resolver"
```

---

## Task 7: Schema-introspection tools

**Files:**
- Create: `src/ai/tools.ts`
- Create: `src/ai/tools.test.ts`

- [ ] **Step 7.1: Write the failing test**

`src/ai/tools.test.ts`:
```ts
import { test, expect } from "bun:test"
import { makeSchemaTools } from "./tools"
import type { ToolContext } from "./types"

function makeCtx(overrides: Partial<ToolContext> = {}): ToolContext {
  return {
    driver: {
      kind: "postgres",
      connect: async () => {},
      disconnect: async () => {},
      query: async () => ({ columns: [], rows: [], rowCount: 0 }),
      listTables: async () => [],
      listColumns: async () => [],
    },
    tables: async () => ["users", "orders"],
    columns: async (t: string) =>
      t === "users"
        ? [{ name: "id", type: "int", nullable: false }]
        : [],
    ...overrides,
  }
}

test("list_tables returns all tables", async () => {
  const [list] = makeSchemaTools(makeCtx())
  expect(list?.name).toBe("list_tables")
  const result = await list!.execute({})
  expect(result).toEqual(["users", "orders"])
})

test("get_columns returns columns for a table", async () => {
  const tools = makeSchemaTools(makeCtx())
  const get = tools.find((t) => t.name === "get_columns")!
  const result = await get.execute({ table: "users" })
  expect(result).toEqual([{ name: "id", type: "int", nullable: false }])
})

test("search_tables substring-matches case-insensitively", async () => {
  const ctx = makeCtx({
    tables: async () => ["Users", "user_sessions", "orders"],
  })
  const search = makeSchemaTools(ctx).find((t) => t.name === "search_tables")!
  const result = await search.execute({ keyword: "USER" })
  expect(result).toEqual(["Users", "user_sessions"])
})

test("search_tables caps at 20 hits", async () => {
  const many = Array.from({ length: 50 }, (_, i) => `t_${i}`)
  const ctx = makeCtx({ tables: async () => many })
  const search = makeSchemaTools(ctx).find((t) => t.name === "search_tables")!
  const result = (await search.execute({ keyword: "t_" })) as string[]
  expect(result).toHaveLength(20)
})

test("sample_rows quotes identifier and caps limit at 20", async () => {
  const queries: string[] = []
  const ctx = makeCtx({
    driver: {
      ...makeCtx().driver,
      kind: "postgres",
      query: async (sql: string) => {
        queries.push(sql)
        return { columns: ["id"], rows: [[1]], rowCount: 1 }
      },
    },
  })
  const sample = makeSchemaTools(ctx).find((t) => t.name === "sample_rows")!
  await sample.execute({ table: "users", limit: 100 })
  expect(queries[0]).toBe('SELECT * FROM "users" LIMIT 20')
})

test("sample_rows defaults limit to 5", async () => {
  const queries: string[] = []
  const ctx = makeCtx({
    driver: {
      ...makeCtx().driver,
      query: async (sql: string) => {
        queries.push(sql)
        return { columns: [], rows: [], rowCount: 0 }
      },
    },
  })
  const sample = makeSchemaTools(ctx).find((t) => t.name === "sample_rows")!
  await sample.execute({ table: "users" })
  expect(queries[0]).toBe('SELECT * FROM "users" LIMIT 5')
})
```

- [ ] **Step 7.2: Run tests — confirm failure**

Run: `bun test src/ai/tools.test.ts`
Expected: FAIL with module-not-found.

- [ ] **Step 7.3: Implement `src/ai/tools.ts`**

```ts
import { quoteIdentifier } from "../components/sql/quote-identifier"
import type { AiTool, ToolContext } from "./types"

export function makeSchemaTools(ctx: ToolContext): AiTool[] {
  return [
    {
      name: "list_tables",
      description: "List every table available in the connected database.",
      argsSchema: { type: "object", properties: {} },
      async execute() {
        return ctx.tables()
      },
    },
    {
      name: "get_columns",
      description:
        "Return the columns (name, type, nullable) for a given table. Call this before writing SQL against a table you have not inspected yet.",
      argsSchema: {
        type: "object",
        properties: {
          table: { type: "string", description: "The table name to inspect." },
        },
        required: ["table"],
      },
      async execute(args) {
        const table = String(args.table ?? "")
        return ctx.columns(table)
      },
    },
    {
      name: "search_tables",
      description:
        "Find tables whose names contain the given keyword (case-insensitive substring match). Returns at most 20 hits.",
      argsSchema: {
        type: "object",
        properties: {
          keyword: { type: "string", description: "Substring to search for." },
        },
        required: ["keyword"],
      },
      async execute(args) {
        const keyword = String(args.keyword ?? "").toLowerCase()
        const tables = await ctx.tables()
        return tables
          .filter((t) => t.toLowerCase().includes(keyword))
          .slice(0, 20)
      },
    },
    {
      name: "sample_rows",
      description:
        "Run SELECT * FROM <table> LIMIT N and return up to 20 rows. Use this only when you need to see real data shapes (e.g. JSON column structure, enum values).",
      argsSchema: {
        type: "object",
        properties: {
          table: { type: "string", description: "The table to sample." },
          limit: {
            type: "integer",
            description: "Row cap (default 5, max 20).",
          },
        },
        required: ["table"],
      },
      async execute(args) {
        const table = String(args.table ?? "")
        const requested = Number(args.limit ?? 5)
        const limit = Math.max(1, Math.min(20, Number.isFinite(requested) ? requested : 5))
        const sql = `SELECT * FROM ${quoteIdentifier(ctx.driver.kind, table)} LIMIT ${limit}`
        const result = await ctx.driver.query(sql, { maxRows: limit })
        return { columns: result.columns, rows: result.rows }
      },
    },
  ]
}
```

- [ ] **Step 7.4: Run tests — confirm pass**

Run: `bun test src/ai/tools.test.ts`
Expected: 6 pass, 0 fail.

- [ ] **Step 7.5: Commit**

```bash
git add src/ai/tools.ts src/ai/tools.test.ts
git commit -m "feat: add schema-introspection tools for AI agents"
```

---

## Task 8: Anthropic adapter

**Files:**
- Create: `src/ai/anthropic-adapter.ts`

- [ ] **Step 8.1: Implement `src/ai/anthropic-adapter.ts`**

```ts
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
```

- [ ] **Step 8.2: Typecheck**

Run: `bun run typecheck`
Expected: exit 0.

If the Anthropic SDK's type names (`Anthropic.Tool`, `Anthropic.MessageParam`, `Anthropic.TextBlock`, `Anthropic.ToolUseBlock`, `Anthropic.ToolResultBlockParam`) differ in the installed version, fix imports against the SDK's `index.d.ts` — the structural shapes (`{ type: "text", text }` / `{ type: "tool_use", id, name, input }` / `{ type: "tool_result", tool_use_id, content }`) are stable.

- [ ] **Step 8.3: Commit**

```bash
git add src/ai/anthropic-adapter.ts
git commit -m "feat: add Anthropic adapter with tool-use agent loop"
```

---

## Task 9: OpenAI-compatible adapter (serves `openai` and `openrouter`)

**Files:**
- Create: `src/ai/openai-compatible-adapter.ts`

- [ ] **Step 9.1: Implement `src/ai/openai-compatible-adapter.ts`**

```ts
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
      parameters: t.argsSchema as Record<string, unknown>,
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
```

- [ ] **Step 9.2: Typecheck**

Run: `bun run typecheck`
Expected: exit 0.

- [ ] **Step 9.3: Commit**

```bash
git add src/ai/openai-compatible-adapter.ts
git commit -m "feat: add OpenAI-compatible adapter for openai and openrouter"
```

---

## Task 10: Gemini adapter

**Files:**
- Create: `src/ai/gemini-adapter.ts`

- [ ] **Step 10.1: Implement `src/ai/gemini-adapter.ts`**

```ts
import { GoogleGenAI } from "@google/genai"
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
    const contents: any[] = [
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
            } as any,
          }),
        { signal: req.signal, isRateLimit: isGeminiRateLimit },
      )

      const candidate = response.candidates?.[0]
      const parts = candidate?.content?.parts ?? []
      const funcCalls = parts.filter((p: any) => p.functionCall) as Array<{
        functionCall: { name: string; args?: Record<string, unknown> }
      }>

      if (funcCalls.length === 0) {
        const text = parts
          .filter((p: any) => typeof p.text === "string")
          .map((p: any) => p.text as string)
          .join("")
        return stripCodeFences(text)
      }

      contents.push({ role: "model", parts })

      const responseParts: any[] = []
      for (const fc of funcCalls) {
        const tool = req.tools.find((t) => t.name === fc.functionCall.name)
        const args = fc.functionCall.args ?? {}
        req.onStatus({ kind: "tool", tool: fc.functionCall.name, args })
        let result: unknown
        if (!tool) {
          result = { error: `Unknown tool: ${fc.functionCall.name}` }
        } else {
          try {
            result = await tool.execute(args)
          } catch (e) {
            result = { error: e instanceof Error ? e.message : String(e) }
          }
        }
        responseParts.push({
          functionResponse: {
            name: fc.functionCall.name,
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
    parameters: t.argsSchema,
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
```

- [ ] **Step 10.2: Typecheck**

Run: `bun run typecheck`
Expected: exit 0.

The `as any` casts on `config` and `parts` are intentional — `@google/genai` types are looser than the runtime contract and tightening them costs more than it saves. If the SDK version shipped does not expose `ai.models.generateContent` with a `config.tools.functionDeclarations` shape, verify against `node_modules/@google/genai/dist/` and adjust the call sites; the loop structure is unaffected.

- [ ] **Step 10.3: Commit**

```bash
git add src/ai/gemini-adapter.ts
git commit -m "feat: add Gemini adapter with functionCall agent loop"
```

---

## Task 11: Adapter registry

**Files:**
- Create: `src/ai/registry.ts`

- [ ] **Step 11.1: Implement `src/ai/registry.ts`**

```ts
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
```

- [ ] **Step 11.2: Typecheck**

Run: `bun run typecheck`
Expected: exit 0.

- [ ] **Step 11.3: Commit**

```bash
git add src/ai/registry.ts
git commit -m "feat: add AI adapter registry"
```

---

## Task 12: AiContext provider

**Files:**
- Create: `src/ai-context.tsx`

- [ ] **Step 12.1: Implement `src/ai-context.tsx`**

```tsx
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react"
import type { ReactNode } from "react"
import { useApp } from "./app-context"
import { useSchema } from "./schema-context"
import { loadAiConfig, loadApiKey, envVarHint } from "./ai/config"
import { createAiAdapter } from "./ai/registry"
import { makeSchemaTools } from "./ai/tools"
import {
  AiConfigError,
  type AiAdapter,
  type AiStatus,
  type ToolContext,
} from "./ai/types"

export type AiState = "idle" | "running"

export interface AiContextValue {
  state: AiState
  cancel(): void
  requestSql(req: {
    prompt: string
    blockContext: string
    onStatus: (s: AiStatus) => void
  }): Promise<string>
}

const AiContext = createContext<AiContextValue | null>(null)

export function useAi(): AiContextValue {
  const ctx = useContext(AiContext)
  if (!ctx) throw new Error("useAi must be used within AiProvider")
  return ctx
}

export function AiProvider({ children }: { children: ReactNode }) {
  const { driver } = useApp()
  const { tablesState, columnsCache, ensureColumns } = useSchema()
  const [state, setState] = useState<AiState>("idle")
  const inFlightRef = useRef<AbortController | null>(null)
  const adapterCacheRef = useRef<{ kind: string; adapter: AiAdapter } | null>(null)

  const tablesStateRef = useRef(tablesState)
  tablesStateRef.current = tablesState
  const columnsCacheRef = useRef(columnsCache)
  columnsCacheRef.current = columnsCache
  const ensureColumnsRef = useRef(ensureColumns)
  ensureColumnsRef.current = ensureColumns

  const buildToolContext = useCallback((): ToolContext => {
    if (!driver) throw new Error("AI requested before driver connected")
    return {
      driver,
      tables: () => resolveTables(tablesStateRef.current, driver),
      columns: (table) =>
        resolveColumns(
          table,
          columnsCacheRef.current,
          ensureColumnsRef.current,
          driver,
        ),
    }
  }, [driver])

  const requestSql = useCallback<AiContextValue["requestSql"]>(
    async ({ prompt, blockContext, onStatus }) => {
      if (!driver) throw new Error("No active database connection")
      const config = await loadAiConfig()
      if (!config) {
        throw new AiConfigError(
          "AI is not configured. Run /ai-config to pick an adapter and model.",
        )
      }
      const apiKey = loadApiKey(config.adapter)
      if (!apiKey) {
        throw new AiConfigError(
          `Missing API key for ${config.adapter}. Set ${envVarHint(config.adapter)} in your environment.`,
        )
      }

      let cached = adapterCacheRef.current
      if (!cached || cached.kind !== config.adapter) {
        cached = { kind: config.adapter, adapter: createAiAdapter(config.adapter) }
        adapterCacheRef.current = cached
      }

      const controller = new AbortController()
      inFlightRef.current?.abort()
      inFlightRef.current = controller
      setState("running")

      try {
        const tools = makeSchemaTools(buildToolContext())
        const sql = await cached.adapter.generateSql({
          prompt,
          blockContext,
          driverKind: driver.kind,
          tools,
          model: config.model,
          apiKey,
          onStatus,
          signal: controller.signal,
        })
        return sql
      } finally {
        if (inFlightRef.current === controller) {
          inFlightRef.current = null
        }
        setState("idle")
      }
    },
    [driver, buildToolContext],
  )

  const cancel = useCallback(() => {
    inFlightRef.current?.abort()
  }, [])

  const value = useMemo<AiContextValue>(
    () => ({ state, cancel, requestSql }),
    [state, cancel, requestSql],
  )

  return <AiContext.Provider value={value}>{children}</AiContext.Provider>
}

async function resolveTables(
  state: ReturnType<typeof useSchema>["tablesState"],
  driver: NonNullable<ReturnType<typeof useApp>["driver"]>,
): Promise<string[]> {
  if (state.kind === "loaded") return state.tables
  return driver.listTables()
}

async function resolveColumns(
  table: string,
  cache: ReturnType<typeof useSchema>["columnsCache"],
  ensure: ReturnType<typeof useSchema>["ensureColumns"],
  driver: NonNullable<ReturnType<typeof useApp>["driver"]>,
) {
  const entry = cache[table]
  if (entry?.kind === "loaded") return entry.columns
  ensure(table)
  return driver.listColumns(table)
}
```

- [ ] **Step 12.2: Typecheck**

Run: `bun run typecheck`
Expected: exit 0.

- [ ] **Step 12.3: Commit**

```bash
git add src/ai-context.tsx
git commit -m "feat: add AiProvider wiring driver + schema + adapter"
```

---

## Task 13: `/ai-config` modal

**Files:**
- Create: `src/screens/ai-config-modal.tsx`

- [ ] **Step 13.1: Implement `src/screens/ai-config-modal.tsx`**

```tsx
import type { InputRenderable, SelectOption } from "@opentui/core"
import { useKeyboard } from "@opentui/react"
import { useRef, useState } from "react"
import { AVAILABLE_AI_ADAPTERS } from "../ai/registry"
import { envVarHint, saveAiConfig } from "../ai/config"
import type { AiAdapterKind } from "../ai/types"
import { colors } from "../theme"

const ADAPTER_LABELS: Record<AiAdapterKind, { name: string; description: string }> = {
  anthropic: {
    name: "Anthropic Claude",
    description: "anthropic · needs ANTHROPIC_API_KEY",
  },
  openai: {
    name: "OpenAI",
    description: "openai · needs OPENAI_API_KEY",
  },
  openrouter: {
    name: "OpenRouter",
    description: "openrouter · needs OPENROUTER_API_KEY · free models with :free suffix",
  },
  gemini: {
    name: "Google Gemini",
    description: "gemini · needs GEMINI_API_KEY (free tier available)",
  },
}

interface AiConfigModalProps {
  open: boolean
  onClose(): void
  onSaved(): void
}

export function AiConfigModal({ open, onClose, onSaved }: AiConfigModalProps) {
  const [adapter, setAdapter] = useState<AiAdapterKind | null>(null)
  const [model, setModel] = useState("")
  const inputRef = useRef<InputRenderable | null>(null)

  useKeyboard((key) => {
    if (!open) return
    if (key.name === "escape") {
      setAdapter(null)
      setModel("")
      onClose()
    }
  })

  if (!open) return null

  if (!adapter) {
    const options: SelectOption[] = AVAILABLE_AI_ADAPTERS.map((kind) => ({
      name: ADAPTER_LABELS[kind].name,
      description: ADAPTER_LABELS[kind].description,
      value: kind,
    }))
    return (
      <ModalShell title=" AI adapter ">
        <box flexDirection="row" gap={1}>
          <text fg={colors.command}>↑/↓</text>
          <text fg={colors.textDim}>navigate</text>
          <text fg={colors.textMuted}>·</text>
          <text fg={colors.command}>enter</text>
          <text fg={colors.textDim}>select</text>
          <text fg={colors.textMuted}>·</text>
          <text fg={colors.command}>esc</text>
          <text fg={colors.textDim}>cancel</text>
        </box>
        <select
          width={60}
          height={Math.max(8, options.length + 2)}
          options={options}
          wrapSelection
          focused
          onSelect={(_idx, opt) => {
            if (opt) setAdapter(opt.value as AiAdapterKind)
          }}
        />
      </ModalShell>
    )
  }

  const handleSubmit = async () => {
    const trimmed = model.trim()
    if (!trimmed) return
    await saveAiConfig({ adapter, model: trimmed })
    setAdapter(null)
    setModel("")
    onSaved()
    onClose()
  }

  return (
    <ModalShell title={` Model · ${ADAPTER_LABELS[adapter].name} `}>
      <text fg={colors.textDim}>
        API key env var: <text fg={colors.command}>{envVarHint(adapter)}</text>
      </text>
      <input
        ref={(el) => {
          inputRef.current = el
        }}
        width={50}
        placeholder={modelPlaceholder(adapter)}
        placeholderColor={colors.textMuted}
        value={model}
        focused
        onInput={setModel}
        onSubmit={() => {
          void handleSubmit()
        }}
      />
      <box flexDirection="row" gap={1}>
        <text fg={colors.command}>enter</text>
        <text fg={colors.textDim}>save</text>
        <text fg={colors.textMuted}>·</text>
        <text fg={colors.command}>esc</text>
        <text fg={colors.textDim}>cancel</text>
      </box>
    </ModalShell>
  )
}

function ModalShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <box
      position="absolute"
      left={0}
      top={0}
      right={0}
      bottom={0}
      justifyContent="center"
      alignItems="center"
    >
      <box
        borderStyle="rounded"
        borderColor={colors.panelQuery}
        padding={1}
        title={title}
        titleAlignment="left"
        flexDirection="column"
        gap={1}
        backgroundColor={colors.surfaceAlt}
      >
        {children}
      </box>
    </box>
  )
}

function modelPlaceholder(adapter: AiAdapterKind): string {
  switch (adapter) {
    case "anthropic": return "e.g. claude-sonnet-4-6"
    case "openai": return "e.g. gpt-4o-mini"
    case "openrouter": return "e.g. meta-llama/llama-3.3-70b-instruct:free"
    case "gemini": return "e.g. gemini-2.5-flash"
  }
}
```

- [ ] **Step 13.2: Typecheck**

Run: `bun run typecheck`
Expected: exit 0.

- [ ] **Step 13.3: Commit**

```bash
git add src/screens/ai-config-modal.tsx
git commit -m "feat: add AI config modal with adapter select and model input"
```

---

## Task 14: `@ai:` syntax token + style

**Files:**
- Modify: `src/components/sql/sql-tokens.ts`
- Modify: `src/components/sql/sql-syntax.ts`

- [ ] **Step 14.1: Add `"ai-directive"` to the token type union**

In `src/components/sql/sql-tokens.ts`, update the `SqlTokenType` type:

```ts
export type SqlTokenType =
  | "keyword"
  | "type"
  | "builtin"
  | "function"
  | "string"
  | "number"
  | "comment"
  | "operator"
  | "punctuation"
  | "identifier"
  | "table"
  | "column"
  | "ai-directive"
```

- [ ] **Step 14.2: Emit `ai-directive` tokens in the tokenizer**

In `src/components/sql/sql-tokens.ts`, inside `tokenizeSql`, add a new branch immediately AFTER the `i < len` check at the top of the loop body and BEFORE the `-- line comment` branch. The directive only matches at the start of a line (offset 0 or after `\n`):

```ts
    // @ai: directive at start of line — captures the entire line so the
    // editor highlights "@ai: list active users" as one prominent run.
    if (ch === "@" && (i === 0 || text[i - 1] === "\n")) {
      const head = text.slice(i, i + 4).toLowerCase()
      if (head === "@ai:") {
        const start = i
        while (i < len && text[i] !== "\n") i++
        tokens.push({
          type: "ai-directive",
          start,
          end: i,
          text: text.slice(start, i),
        })
        continue
      }
    }
```

- [ ] **Step 14.3: Add the style entry**

In `src/components/sql/sql-syntax.ts`, add a new entry to `TOKEN_COLORS`:

```ts
  "ai-directive": { fg: "#F0B458", bold: true },
```

(Amber, matching `colors.command` from the theme — visually identical to slash commands so users immediately recognise it as a directive.)

- [ ] **Step 14.4: Typecheck**

Run: `bun run typecheck`
Expected: exit 0.

- [ ] **Step 14.5: Commit**

```bash
git add src/components/sql/sql-tokens.ts src/components/sql/sql-syntax.ts
git commit -m "feat: syntax-highlight @ai: directive lines"
```

---

## Task 15: Wire AI into `main.tsx`

This task threads the `AiProvider`, the submit interception, the `/ai-config` slash command, and Esc-cancel into the main screen. It is the largest task by line count but each step is contained.

**Files:**
- Modify: `src/screens/main.tsx`

- [ ] **Step 15.1: Add `AiProvider` to the provider tree**

At the top of `src/screens/main.tsx`, add the import:

```ts
import { AiProvider } from "../ai-context"
```

Add `useAi` and `AiConfigModal` imports near them:

```ts
import { useAi } from "../ai-context"
import { AiConfigModal } from "./ai-config-modal"
import { extractAiPrompt } from "../ai/extract-ai-prompt"
import { AiConfigError, AgentLimitError, type AiStatus } from "../ai/types"
```

Update the outer `MainScreen` component to wrap with `AiProvider`:

```tsx
export function MainScreen() {
  const { connection, driver } = useApp()
  if (!connection) return null
  return (
    <SchemaProvider driver={driver}>
      <AiProvider>
        <QueriesProvider connectionId={connection.id}>
          <MainScreenInner />
        </QueriesProvider>
      </AiProvider>
    </SchemaProvider>
  )
}
```

- [ ] **Step 15.2: Pull AI state into `MainScreenInner`**

Inside `MainScreenInner`, near the existing `const { driver, ... } = useApp()`, add:

```ts
const { state: aiState, requestSql, cancel: cancelAi } = useAi()
const [aiConfigOpen, setAiConfigOpen] = useState(false)
```

Add `aiConfigOpen` to the `modalOpen` calculation:

```ts
const modalOpen =
  paletteOpen ||
  !!confirmRequest ||
  !!inputPrompt ||
  switchModalOpen ||
  helpOpen ||
  aiConfigOpen
```

- [ ] **Step 15.3: Add the `runAiBlock` handler**

Inside `MainScreenInner`, after `runEditorQuery` and before `cmds`, add the helper that runs the AI flow against the current block:

```ts
const runAiBlock = useCallback(async () => {
  const ta = textareaRef.current
  if (!ta) return
  const text = ta.plainText
  const cursor = ta.cursorOffset
  const { blockText, blockStart } = extractBlockAtCursor(text, cursor)
  const match = extractAiPrompt(blockText, blockStart)
  if (!match) return

  setRunInfo({ status: "ok", text: "⟳ AI thinking…" })

  const onStatus = (s: AiStatus) => {
    if (s.kind === "thinking") {
      setRunInfo({ status: "ok", text: "⟳ AI thinking…" })
    } else {
      setRunInfo({
        status: "ok",
        text: `⟳ ${s.tool}${formatToolArgs(s.args)}…`,
      })
    }
  }

  try {
    const sql = await requestSql({
      prompt: match.prompt,
      blockContext: match.blockContext,
      onStatus,
    })
    replaceEditorRange(ta, match.range, `-- @ai: ${match.prompt}\n${sql}`)
    setRunInfo({ status: "ok", text: "✓ AI replaced @ai block" })
  } catch (e) {
    if ((e as DOMException)?.name === "AbortError") {
      setRunInfo(null)
      return
    }
    if (e instanceof AiConfigError) {
      setRunInfo({ status: "error", text: `✗ ${e.message}` })
      showToast("Run /ai-config to set up your AI adapter", { kind: "error" })
      return
    }
    if (e instanceof AgentLimitError) {
      setRunInfo({
        status: "error",
        text: `✗ AI gave up after ${e.iterations} tool calls`,
      })
      return
    }
    const message = e instanceof Error ? e.message : String(e)
    setRunInfo({ status: "error", text: `✗ AI error: ${message}` })
  }
}, [requestSql, showToast])
```

- [ ] **Step 15.4: Add the helper functions referenced above**

At the bottom of `src/screens/main.tsx`, alongside `extractStatements` / `findBlockStart`, add:

```ts
function extractBlockAtCursor(
  text: string,
  cursorOffset: number,
): { blockText: string; blockStart: number } {
  const cursor = Math.min(Math.max(cursorOffset, 0), text.length)
  const blockStart = findBlockStart(text, cursor)
  const blockEnd = findBlockEnd(text, cursor)
  return { blockText: text.slice(blockStart, blockEnd), blockStart }
}

function findBlockEnd(text: string, cursor: number): number {
  let i = cursor
  while (i < text.length && text[i] !== "\n") i++
  while (i < text.length) {
    const lineStart = i + 1
    if (lineStart >= text.length) break
    let lineEnd = lineStart
    while (lineEnd < text.length && text[lineEnd] !== "\n") lineEnd++
    const line = text.slice(lineStart, lineEnd)
    if (/^\s*-{3,}\s*$/.test(line)) return lineStart > 0 ? lineStart - 1 : 0
    i = lineEnd
  }
  return text.length
}

function replaceEditorRange(
  ta: TextareaRenderable,
  range: { start: number; end: number },
  replacement: string,
): void {
  const buffer = ta.editBuffer
  const start = buffer.offsetToPosition(range.start)
  const end = buffer.offsetToPosition(range.end)
  if (!start || !end) return
  ta.deleteRange(start.row, start.col, end.row, end.col)
  buffer.setCursorByOffset(range.start)
  ta.insertText(replacement)
}

function formatToolArgs(args: Record<string, unknown>): string {
  const keys = Object.keys(args)
  if (keys.length === 0) return ""
  const first = keys[0]!
  const value = args[first]
  if (typeof value === "string" || typeof value === "number") {
    return `(${first}: ${value})`
  }
  return ""
}
```

`extractBlockAtCursor` reuses `findBlockStart` (already in this file).

- [ ] **Step 15.5: Route `@ai:` blocks in `handleSubmit`**

Find the existing `handleSubmit` function. Before the `extractStatements` call, add the AI detection:

Replace:
```ts
const handleSubmit = async () => {
  const ta = textareaRef.current
  if (!ta || !driver) return

  const text = ta.plainText
  const cursor = ta.cursorOffset
  const statements = extractStatements(text, cursor)
  if (statements.length === 0) return
```

with:
```ts
const handleSubmit = async () => {
  const ta = textareaRef.current
  if (!ta || !driver) return

  const text = ta.plainText
  const cursor = ta.cursorOffset

  const { blockText, blockStart } = extractBlockAtCursor(text, cursor)
  if (extractAiPrompt(blockText, blockStart)) {
    if (aiState === "running") return
    await runAiBlock()
    return
  }

  const statements = extractStatements(text, cursor)
  if (statements.length === 0) return
```

(The rest of `handleSubmit` is unchanged.)

- [ ] **Step 15.6: Add the `/ai-config` slash command**

Inside the `cmds` array, after `/help` and before `/exit`, insert:

```ts
{
  name: "/ai-config",
  description: "Pick an AI adapter and model for @ai prompts",
  handler: () => setAiConfigOpen(true),
},
```

The dep list of the `cmds` `useMemo` already does not pin `setAiConfigOpen` (state setters are stable), so no change to the deps array is needed.

- [ ] **Step 15.7: Add Esc-to-cancel for the AI flow**

Inside the top-level `useKeyboard` block in `MainScreenInner`, AFTER the existing handlers but inside the same callback, add:

```ts
if (key.name === "escape" && aiState === "running") {
  cancelAi()
  return
}
```

Since the existing code returns early when `modalOpen`, and no modal is open while AI is running, this handler reaches the cancel path correctly.

- [ ] **Step 15.8: Render the `AiConfigModal`**

In the return JSX of `MainScreenInner`, after `<HelpModal …/>`, add:

```tsx
<AiConfigModal
  open={aiConfigOpen}
  onClose={() => setAiConfigOpen(false)}
  onSaved={() => {
    showToast("AI config saved", { kind: "success" })
  }}
/>
```

- [ ] **Step 15.9: Typecheck**

Run: `bun run typecheck`
Expected: exit 0.

- [ ] **Step 15.10: Commit**

```bash
git add src/screens/main.tsx
git commit -m "feat: wire @ai directive, /ai-config command, and Esc-cancel"
```

---

## Task 16: Manual verification

This codebase has no automated UI tests; verify the integration end-to-end manually.

- [ ] **Step 16.1: Run the full test suite**

```bash
bun test
```
Expected: all pure-function tests pass (extractAiPrompt, strip-fences, retry, tools).

- [ ] **Step 16.2: Start the app against a real database**

```bash
bun run start
```

Connect to any existing connection (postgres / sqlite / mysql). Wait for the tables sidebar to populate.

- [ ] **Step 16.3: Verify `@ai:` highlight**

Type a single line in the editor:
```
@ai: list active users
```
Expected: the entire line is rendered in bold amber (`#F0B458`).

- [ ] **Step 16.4: Verify "AI not configured" error**

With no `~/.query-cli/ai.json`, press F5.
Expected:
- `runInfo` shows `✗ AI is not configured. Run /ai-config to pick an adapter and model.`
- A toast appears: `Run /ai-config to set up your AI adapter`.

- [ ] **Step 16.5: Configure an adapter**

Type `/ai-config` and press F5 (or Enter on the completion). Pick an adapter, enter a model:
- Anthropic: `claude-sonnet-4-6` (needs `ANTHROPIC_API_KEY`)
- OpenAI: `gpt-4o-mini` (needs `OPENAI_API_KEY`)
- OpenRouter: `meta-llama/llama-3.3-70b-instruct:free` (needs `OPENROUTER_API_KEY`)
- Gemini: `gemini-2.5-flash` (needs `GEMINI_API_KEY`)

Expected: toast `AI config saved`. File `~/.query-cli/ai.json` exists with the chosen config.

- [ ] **Step 16.6: Verify missing API key error**

Without the env var set, press F5 on an `@ai:` line.
Expected: `runInfo` shows `✗ Missing API key for <adapter>. Set <ENV_VAR>…`.

- [ ] **Step 16.7: Set env var and run a prompt**

PowerShell:
```powershell
$env:ANTHROPIC_API_KEY = "sk-…"   # or your chosen provider
bun run start
```

Bash:
```bash
export ANTHROPIC_API_KEY=sk-…
bun run start
```

Type:
```
@ai: list active users
```
Press F5.

Expected sequence in `runInfo`:
1. `⟳ AI thinking…`
2. `⟳ list_tables…` or `⟳ search_tables(keyword: users)…`
3. `⟳ get_columns(table: users)…`
4. `✓ AI replaced @ai block`

Editor afterwards:
```
-- @ai: list active users
SELECT * FROM users WHERE active = true
```
(Exact SQL varies by model and schema.)

Press F5 again — the SQL executes normally.

- [ ] **Step 16.8: Verify Esc cancellation**

Type `@ai: …` and press F5. Immediately press Esc.
Expected: `runInfo` clears, the `@ai:` line remains unchanged in the editor.

- [ ] **Step 16.9: Verify iteration in an existing block**

Type:
```
SELECT id FROM users
@ai: also include email and sort by created_at desc
```
Press F5.

Expected: model sees the existing SQL as `blockContext`; replacement SQL extends the original.

- [ ] **Step 16.10: Verify the agent-limit guard (optional, hard to trigger)**

If you have a prompt that confuses a small model into looping (e.g. very vague request on a 500-table DB), confirm that after 10 tool calls the error `✗ AI gave up after 10 tool calls` appears. This is a sanity check — not a hard requirement.

- [ ] **Step 16.11: Final commit if any tweaks were made**

If steps 16.3–16.10 surfaced bugs and you patched them, commit each fix as a separate commit with a focused message. Otherwise this task ends with no commit.
