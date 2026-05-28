# AI Integration Design

**Date:** 2026-05-28
**Status:** Approved (pending user spec review)

## Goal

Let users generate SQL from natural-language prompts inside the query editor. Typing a line that starts with `@ai:` and pressing the run key sends the prompt — together with live database schema introspection — to an AI agent that returns a SQL query. The query replaces the `@ai:` block in the editor so the user reviews and runs it explicitly.

## Non-goals

- Auto-executing AI-generated SQL. The user always reviews before running.
- A chat-style conversation panel. The editor IS the context.
- Streaming the model's reasoning into the editor. Progress is shown in the existing `runInfo` status line.
- Caching, telemetry, or token-usage tracking for phase 1.

## Trigger syntax

A "statement block at cursor" (as already computed by `extractStatements` in [src/screens/main.tsx](src/screens/main.tsx)) is treated as an AI request when **any line** in the block, after trimming leading whitespace, starts with `@ai:`. Everything after `@ai:` on that line is the prompt; the rest of the block is sent to the model as surrounding-SQL context (useful when the user iterates on an existing query).

Example — fresh prompt:

```
@ai: list active users
```

Example — refining existing SQL:

```
SELECT id, name FROM users
WHERE active = true
@ai: also include the email column and sort by created_at desc
```

In both cases the entire block (start-to-end character range in the textarea) is replaced on success with a leading SQL comment that preserves the prompt:

```
-- @ai: list active users
SELECT * FROM users WHERE active = true
```

If multiple `@ai:` lines exist in one block, only the first triggers; later lines are passed verbatim as part of the prompt context (rare; we accept this rather than designing a multi-prompt flow).

## Architecture

### Layers

```
┌──────────────────────────────────────────────────────────────────┐
│ main.tsx — submit handler                                         │
│   detects @ai block → AiContext.requestSql(...) → replaceRange    │
└──────────────────────────────┬───────────────────────────────────┘
                               │
┌──────────────────────────────▼───────────────────────────────────┐
│ src/ai-context.tsx — React provider                               │
│   - state: idle | running | error                                 │
│   - cancel(): aborts current request                              │
│   - requestSql({prompt, blockContext, onStatus}): Promise<sql>    │
│   - builds ToolContext from driver + schema-context               │
└──────────────────────────────┬───────────────────────────────────┘
                               │
┌──────────────────────────────▼───────────────────────────────────┐
│ src/ai/registry.ts — createAdapter(kind)                          │
└─────┬────────────────────────────────────────────────────────────┘
      │
      ▼
┌──────────────────────────────────────────────────────────────────┐
│ src/ai/types.ts — AiAdapter interface                             │
│   generateSql(req: AiRequest): Promise<string>                    │
│   AiRequest carries prompt, blockContext, tools, abortSignal,     │
│              onStatus, model, apiKey                              │
└─────┬────────────────────────────────────────────────────────────┘
      │ implementations
      ▼
┌──────────────────────────────────────────────────────────────────┐
│ src/ai/anthropic-adapter.ts          — @anthropic-ai/sdk          │
│ src/ai/openai-compatible-adapter.ts  — openai (serves "openai"    │
│                                        and "openrouter" kinds)    │
│ src/ai/gemini-adapter.ts             — @google/genai              │
│   Each: native tool-calling, agent loop, max-iter guard,          │
│         429 retry/backoff. No subprocesses, no MCP.               │
└──────────────────────────────────────────────────────────────────┘
```

This mirrors the existing `src/drivers/` pattern (interface + registry + per-implementation file).

### Why direct API instead of an agent framework

The use case is narrow: one task (NL → SQL), four tools, single-shot output. The "agent loop" we'd otherwise import from a framework is a ~25-line `while` loop in each adapter. Direct API calls give native tool-calling (no MCP plumbing), straightforward `AbortController` cancellation, fewer dependencies, no subprocesses, and explicit control over retries and iteration caps. The `AiAdapter` interface absorbs per-provider differences so callers stay provider-agnostic.

### Module responsibilities

**[src/ai/types.ts](src/ai/types.ts)**

Defines the contract everything else builds on:

- `AiAdapterKind` — `"anthropic" | "openai" | "openrouter" | "gemini"` in phase 1.
- `AiTool` — `{ name: string; description: string; argsSchema: JsonSchema; execute(args): Promise<unknown> }`. `argsSchema` is a small JSON-Schema subset (`type: "object"`, `properties`, `required`) — every provider accepts this shape natively or with trivial wrapping.
- `AiStatus` — `{ kind: "thinking" } | { kind: "tool"; tool: string; args: unknown }`. Pushed via `onStatus` so the UI can render `⟳ AI thinking…` / `⟳ list_tables…`.
- `AiRequest` — `{ prompt: string; blockContext: string; tools: AiTool[]; model: string; apiKey: string; onStatus(s: AiStatus): void; signal: AbortSignal }`.
- `AiAdapter` — `{ readonly kind: AiAdapterKind; generateSql(req: AiRequest): Promise<string> }`.
- `MAX_AGENT_ITERATIONS = 10` — exported constant; each adapter must enforce it.

**[src/ai/tools.ts](src/ai/tools.ts)**

Pure factory that builds the four schema tools from a `ToolContext`:

```ts
interface ToolContext {
  driver: DatabaseDriver
  tables(): Promise<string[]>            // resolves cached list, fetching if absent
  columns(table: string): Promise<ColumnInfo[]>  // same, per-table
}

export function makeSchemaTools(ctx: ToolContext): AiTool[]
```

Tools:

- `list_tables()` → `string[]`. Drains `SchemaContext`; if still `loading`, awaits the in-flight fetch; if `error`, returns `{ error }`.
- `get_columns({ table: string })` → `ColumnInfo[]`. Calls `ctx.columns(table)`.
- `search_tables({ keyword: string })` → `string[]`. Substring + lower-case match against the cached table list. Returns at most 20 hits.
- `sample_rows({ table: string; limit?: number })` → `{ columns: string[]; rows: unknown[][] }`. Runs `SELECT * FROM <quoted table> LIMIT N` (default 5, capped at 20) using the existing `quoteIdentifier`. No PII redaction in phase 1 — the user opted into this tool by configuring AI.

All tool executions are wrapped: thrown errors become `{ error: string }` returned to the model. This is critical for the `tool_errors_to_model` flow — the model can retry with corrected arguments.

**The agent loop (shared logic in concept; implemented per-adapter because API shapes differ)**

Pseudocode each adapter follows:

```
messages = [systemPrompt + user request + blockContext]
for iteration in 0..MAX_AGENT_ITERATIONS:
  if signal.aborted: throw AbortError
  response = await callProvider(messages, tools)  // wrapped in retryOnRateLimit
  toolUses = extractToolUses(response)
  if toolUses is empty:
    return extractSqlText(response)
  append assistant message to history
  for each toolUse:
    onStatus({ kind: "tool", tool: toolUse.name, args: toolUse.args })
    result = await tools[toolUse.name].execute(toolUse.args).catch(e => ({ error: String(e) }))
    append tool result message to history (provider-specific shape)
throw AgentLimitError  // hit MAX_AGENT_ITERATIONS without final answer
```

`onStatus({ kind: "thinking" })` fires once before the first iteration.

**Rate-limit retry helper** (shared, in [src/ai/retry.ts](src/ai/retry.ts)):

```ts
async function retryOnRateLimit<T>(
  fn: () => Promise<T>,
  opts: { signal: AbortSignal; isRateLimit: (e: unknown) => boolean }
): Promise<T>
```

Catches errors matching `opts.isRateLimit` (each adapter passes a predicate — Anthropic 429 / `rate_limit_error`, OpenAI 429, Gemini `RESOURCE_EXHAUSTED`). Backoff is 1s → 2s → 4s, max 3 retries. Aborts immediately if `signal.aborted`. Other errors propagate immediately without retry.

**[src/ai/anthropic-adapter.ts](src/ai/anthropic-adapter.ts)**

Uses `@anthropic-ai/sdk`. Translates `AiTool` → Anthropic tool format (`input_schema` = our `argsSchema` verbatim). Tool-use blocks are pulled from `response.content`; tool results go back as `{role: "user", content: [{type: "tool_result", tool_use_id, content: JSON.stringify(result)}]}`. Final SQL is extracted from the last assistant message's text blocks (concatenated, stripped of code fences if present).

**[src/ai/openai-compatible-adapter.ts](src/ai/openai-compatible-adapter.ts)**

Uses `openai`. Serves both the `"openai"` and `"openrouter"` adapter kinds — OpenRouter exposes an OpenAI-compatible API at `https://openrouter.ai/api/v1`, so the same SDK works with a `baseURL` override. The class takes `{ kind, baseURL?, extraHeaders? }` at construction time and the registry pre-configures both presets:

| Kind        | baseURL                                  | API key env             | Extra headers                              |
|-------------|------------------------------------------|-------------------------|--------------------------------------------|
| `openai`    | (default)                                | `OPENAI_API_KEY`        | none                                        |
| `openrouter`| `https://openrouter.ai/api/v1`           | `OPENROUTER_API_KEY`    | `HTTP-Referer: query-cli`, `X-Title: query-cli` (recommended by OpenRouter for analytics; non-sensitive) |

Translates `AiTool` → `{type: "function", function: {name, description, parameters: argsSchema}}`. Tool calls live in `response.choices[0].message.tool_calls`; tool results go back as `{role: "tool", tool_call_id, content: JSON.stringify(result)}`. Final SQL is `response.choices[0].message.content`.

OpenRouter free-tier note: models with a `:free` suffix (e.g. `meta-llama/llama-3.3-70b-instruct:free`) have stricter rate limits — the same `retryOnRateLimit` helper handles 429s; if all retries fail, the user sees the standard rate-limit error.

**[src/ai/gemini-adapter.ts](src/ai/gemini-adapter.ts)**

Uses `@google/genai`. Translates `AiTool` → `{functionDeclarations: [{name, description, parameters: argsSchema}]}`. Tool calls live in `response.candidates[0].content.parts` as `functionCall` parts; tool results go back as `functionResponse` parts. Final SQL is the concatenated `text` parts of the last response.

**[src/ai/config.ts](src/ai/config.ts)**

```ts
interface AiConfig {
  adapter: AiAdapterKind     // "anthropic" | "openai" | "openrouter" | "gemini"
  model: string              // e.g. "claude-sonnet-4-6", "gpt-4o-mini",
                             //      "meta-llama/llama-3.3-70b-instruct:free",
                             //      "gemini-2.5-flash"
}

export async function loadAiConfig(): Promise<AiConfig | null>
export async function saveAiConfig(cfg: AiConfig): Promise<void>
export function loadApiKey(adapter: AiAdapterKind): string | null  // env-only
```

Stored at `~/.query-cli/ai.json`. The config file holds **no secrets** — API keys are read from environment variables: `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `OPENROUTER_API_KEY`, `GEMINI_API_KEY` (or `GOOGLE_API_KEY` as a fallback for Gemini). `loadApiKey(adapter)` returns the key for the active adapter or `null`. This keeps secrets out of disk files and matches every provider's documented convention.

Reuse `CONFIG_DIR` from [src/config/connections.ts](src/config/connections.ts) — extract to a shared `src/config/dir.ts`.

**[src/ai/registry.ts](src/ai/registry.ts)**

```ts
const registry: Record<AiAdapterKind, () => AiAdapter> = {
  anthropic: () => new AnthropicAdapter(),
  openai: () => new OpenAiCompatibleAdapter({ kind: "openai" }),
  openrouter: () => new OpenAiCompatibleAdapter({
    kind: "openrouter",
    baseURL: "https://openrouter.ai/api/v1",
    extraHeaders: { "HTTP-Referer": "query-cli", "X-Title": "query-cli" },
  }),
  gemini: () => new GeminiAdapter(),
}
export function createAiAdapter(kind: AiAdapterKind): AiAdapter
```

Parallels [src/drivers/index.ts](src/drivers/index.ts).

**[src/ai-context.tsx](src/ai-context.tsx)**

React provider that:

- Reads `AiConfig` lazily; resolves the adapter via `createAiAdapter(config.adapter)`; caches it keyed by `(adapter, model)` so changing model doesn't leak instances.
- Resolves the API key via `loadApiKey(adapter)`. If missing, throws `AiConfigError` with a message naming the expected env var.
- Exposes `requestSql({ prompt, blockContext, onStatus, signal }): Promise<string>`. Builds `ToolContext` from `useApp()` driver + `useSchema()` cache and calls `adapter.generateSql(...)`.
- Exposes `state: "idle" | "running"` and `cancel()` — implemented via a single in-flight `AbortController`. Concurrent AI requests are not supported in phase 1.

Provider nesting in [src/screens/main.tsx](src/screens/main.tsx): `SchemaProvider → AiProvider → QueriesProvider → MainScreenInner`.

**[src/components/query-editor.tsx](src/components/query-editor.tsx)**

No structural change — the editor remains a textarea. Two small additions in the tokenizer:

1. `@ai:` at the start of a line is recognised as a new highlight kind `"ai-directive"` (in [src/components/sql/sql-tokens.ts](src/components/sql/sql-tokens.ts) / [src/components/sql/sql-syntax.ts](src/components/sql/sql-syntax.ts)) styled prominently (`colors.accent`, bold).
2. The submit pathway is unchanged — detection happens in `main.tsx`.

**[src/screens/main.tsx](src/screens/main.tsx)**

Submit handler is extended. After computing the block at cursor:

```ts
const aiPrompt = extractAiPrompt(blockText, blockStart)
```

If non-null:

1. Set `runInfo` to `{ status: "ok", text: "⟳ AI thinking…" }`.
2. Call `requestSql(...)` with an `onStatus` that updates `runInfo` per status event (`⟳ list_tables…`, `⟳ get_columns({table: "users"})…`).
3. On success, build the replacement string `-- @ai: {prompt}\n{sql}` and call `textarea.deleteRange(...) + insertText(...)` (the existing pattern from `acceptSuggestion`).
4. On `AbortError`: clear `runInfo`, leave editor unchanged.
5. On `AgentLimitError`: `runInfo = { status: "error", text: "✗ AI gave up after N tool calls" }`.
6. On `AiConfigError`: `runInfo = { status: "error", text: "✗ AI not configured · run /ai-config" }` + toast `Set ANTHROPIC_API_KEY (or run /ai-config to pick another adapter)`.
7. On any other error: `runInfo = { status: "error", text: "✗ AI error: <message>" }`.
8. Esc while AI is running → `cancel()`. Top-level `useKeyboard` handler checks `aiState === "running"` before swallowing Esc.

New slash command:

- `/ai-config` — opens a modal selecting `adapter` (anthropic / openai / openrouter / gemini), then `model` (free-text). Saves to `ai.json`. Implementation: a small `AiConfigModal` component; reuses `InputPromptModal` patterns. We do NOT prompt for API keys — the toast explains the env var.

### `extractAiPrompt` helper

```ts
function extractAiPrompt(blockText: string, blockStart: number): {
  prompt: string
  blockContext: string  // blockText with the @ai line removed
  range: { start: number; end: number }  // char offsets in the full editor text
} | null
```

Pure function near `extractStatements`. Scans lines, finds the first non-empty line whose trimmed form begins with `@ai:`, returns prompt + neighbouring SQL + block range. `null` if no match.

## State machine

```
        idle ──user F5 on @ai block──▶ running
         ▲                                │
         │                                ├─ success ─▶ idle (editor updated)
         │                                ├─ AbortError ─▶ idle (editor unchanged)
         │                                ├─ AgentLimitError ─▶ idle (runInfo: error)
         │                                ├─ AiConfigError ─▶ idle (runInfo: error + toast)
         │                                └─ other error ─▶ idle (runInfo: error)
         │
       Esc when running calls cancel()
```

One in-flight request at a time. If user hits F5 again while running, we no-op.

## Error surfaces

| Error                         | Where it shows                                                    |
|-------------------------------|-------------------------------------------------------------------|
| `AiConfigError`               | `runInfo`: `✗ AI not configured · run /ai-config` + toast hinting env var |
| Rate-limit (after retries)    | `runInfo`: `✗ AI rate limited — try again`                        |
| `AgentLimitError` (max iters) | `runInfo`: `✗ AI gave up after 10 tool calls`                     |
| Network / SDK error           | `runInfo`: `✗ AI error: <message>`                                |
| Tool execution error          | Returned to model as `{ error: string }`; user sees retries via status line; if the model gives up, agent loop ends with the model's last text or an `AgentLimitError` |
| AbortError (user cancel)      | `runInfo` cleared, no toast                                       |

## Implementation risks

- **Token usage on large schemas.** A 500-table DB blowing past the context window is a real risk if we ever paste the full table list into the system prompt. We mitigate by **not** preloading schema — the system prompt only tells the model "use list_tables / search_tables to discover schema" and lets the model fetch what it needs. Result: small per-request token cost even on huge DBs.
- **Output extraction.** Each provider sometimes wraps SQL in markdown fences despite system instructions. Each adapter strips ```` ``` ```` fences (and an optional `sql` language tag) before returning, and trims surrounding whitespace.
- **Tool argument validation.** We trust the model to follow `argsSchema` but the adapter still calls `tool.execute(args)` inside try/catch — bad args surface as tool errors and the model retries.
- **Provider SDK version drift.** Each adapter is a thin wrapper; the implementation plan pins SDK versions and verifies the tool-calling shape against the SDK source before committing the code.

## Open questions deferred to phase 2

- Local OpenAI-compatible adapters (Ollama, LM Studio) — same `OpenAiCompatibleAdapter` class with different `baseURL`; phase 2 just adds registry entries.
- Multi-turn refinement that doesn't pollute the editor (a small chat pane).
- Streaming the SQL into the editor as it's generated.
- Telemetry / token budget warnings.
- PII redaction for `sample_rows`.

## Testing

This codebase has no test harness yet. The design is structured so the helpers are pure-ish and trivially testable when tests are introduced later:

- `extractAiPrompt` is a pure function — exhaustive line-position tests.
- `makeSchemaTools` is a pure factory over a `ToolContext` interface — fake context, assert tool dispatch.
- `retryOnRateLimit` is pure given its predicate — fake `fn` and `now`.
- Adapters need provider SDK mocks; deferred.

Phase 1 verification is manual: type `@ai: …`, run, observe editor replacement.

## File summary (new + modified)

New:

- `src/ai/types.ts`
- `src/ai/registry.ts`
- `src/ai/anthropic-adapter.ts`
- `src/ai/openai-compatible-adapter.ts` (serves `openai` + `openrouter` kinds)
- `src/ai/gemini-adapter.ts`
- `src/ai/tools.ts`
- `src/ai/retry.ts`
- `src/ai/config.ts`
- `src/ai-context.tsx`
- `src/screens/ai-config-modal.tsx`
- `src/config/dir.ts` (extracted shared `CONFIG_DIR`)

Modified:

- `src/screens/main.tsx` — submit interception, `/ai-config` command, Esc-cancel
- `src/components/sql/sql-tokens.ts` — `@ai:` token kind
- `src/components/sql/sql-syntax.ts` — `@ai:` style
- `src/config/connections.ts` — use the extracted `CONFIG_DIR`
- `package.json` — add `@anthropic-ai/sdk`, `openai`, `@google/genai` dependencies
