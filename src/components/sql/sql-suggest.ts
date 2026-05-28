import { SQL_BUILTINS, SQL_KEYWORDS, SQL_TYPES } from "./sql-tokens"

export type SuggestionKind = "keyword" | "type" | "builtin" | "table" | "column" | "command"

export interface SqlSuggestion {
  text: string
  kind: SuggestionKind
}

const STATIC: SqlSuggestion[] = [
  ...SQL_KEYWORDS.map((text) => ({ text: text.toUpperCase(), kind: "keyword" as const })),
  ...SQL_TYPES.map((text) => ({ text: text.toUpperCase(), kind: "type" as const })),
  ...SQL_BUILTINS.map((text) => ({ text: text.toUpperCase(), kind: "builtin" as const })),
]

export interface SchemaSuggestions {
  tables?: string[]
  // Flat union of all loaded columns — used for unqualified completion.
  columns?: string[]
  // Per-table column list keyed by the canonical table name from the schema
  // store. Used when the user is completing `alias.<col>`.
  columnsByTable?: Record<string, string[]>
}

export interface SqlContext {
  // Resolved alias/table name that came before a `.` immediately preceding
  // the current word. Lower-cased lookups happen against `aliasMap`.
  qualifier: string | null
  aliasMap: Record<string, string>
}

export interface CurrentWord {
  text: string
  start: number
  end: number
}

// Walk back from the cursor to the start of the identifier-like word the user
// is typing. Returns null when the cursor is in whitespace/punctuation so the
// caller can hide the suggestions panel.
export function wordAtCursor(text: string, cursor: number): CurrentWord | null {
  const pos = Math.min(Math.max(cursor, 0), text.length)
  let start = pos
  while (start > 0 && isIdentChar(text[start - 1]!)) start--
  let end = pos
  while (end < text.length && isIdentChar(text[end]!)) end++
  if (start === end) return null
  return { text: text.slice(start, end), start, end }
}

// Detect a slash-prefixed command token at the cursor (`/exi|`). Fires
// wherever the cursor sits inside a `/word` whose slash isn't glued to an
// identifier — so `select * from /` triggers but `path/to/file` does not.
// `MainScreen.handleSubmit` is the one that decides whether to execute the
// command on submit; the panel only surfaces matches.
export function slashWordAtCursor(text: string, cursor: number): CurrentWord | null {
  const pos = Math.min(Math.max(cursor, 0), text.length)
  let start = pos
  while (start > 0 && isCommandChar(text[start - 1]!)) start--
  if (start === 0 || text[start - 1] !== "/") return null
  const slashPos = start - 1
  if (slashPos > 0 && isIdentChar(text[slashPos - 1]!)) return null
  let end = pos
  while (end < text.length && isCommandChar(text[end]!)) end++
  return { text: text.slice(slashPos, end), start: slashPos, end }
}

// Match `commands` whose name shares the typed slash-prefix. Empty body (just
// `/`) lists every command so the user can discover what is available.
export function getCommandSuggestions(prefix: string, commands: string[], limit = 8): SqlSuggestion[] {
  const needle = prefix.toLowerCase()
  const out: SqlSuggestion[] = []
  for (const name of commands) {
    if (needle === "/" || name.toLowerCase().startsWith(needle)) {
      out.push({ text: name, kind: "command" })
      if (out.length >= limit) break
    }
  }
  return out
}

// Detect a `<ident>.` immediately before `position` and return the bare
// identifier. Lets us drive qualified completion (`o.<col>`) even when the
// cursor sits right after the dot and there is no current word yet.
export function qualifierBefore(text: string, position: number): string | null {
  if (position <= 0 || text[position - 1] !== ".") return null
  let end = position - 1
  let start = end
  while (start > 0 && isIdentChar(text[start - 1]!)) start--
  if (start === end) return null
  return text.slice(start, end)
}

export function getSuggestions(
  prefix: string,
  schema?: SchemaSuggestions,
  context?: SqlContext,
  limit = 6,
): SqlSuggestion[] {
  // Qualified path (`alias.col`) — restrict to columns of the resolved table.
  // An empty prefix is allowed here so the panel pops as soon as the user
  // types the dot.
  if (context?.qualifier) {
    const tableName = context.aliasMap[context.qualifier.toLowerCase()]
    if (!tableName) return []
    const cols = schema?.columnsByTable?.[tableName] ?? []
    return matchAll(prefix, cols.map((c) => ({ text: c, kind: "column" as const })), limit)
  }

  if (!prefix) return []
  const candidates: SqlSuggestion[] = [...STATIC]
  if (schema?.tables) {
    for (const t of schema.tables) candidates.push({ text: t, kind: "table" })
  }
  if (schema?.columns) {
    for (const c of schema.columns) candidates.push({ text: c, kind: "column" })
  }
  return matchAll(prefix, candidates, limit)
}

// Prefix matches first, then substring matches — most editors do this and it
// surfaces obvious completions without surprising the user with random hits.
function matchAll(
  prefix: string,
  candidates: SqlSuggestion[],
  limit: number,
): SqlSuggestion[] {
  const needle = prefix.toLowerCase()
  const prefixMatches: SqlSuggestion[] = []
  const substringMatches: SqlSuggestion[] = []
  const seen = new Set<string>()

  for (const item of candidates) {
    const lower = item.text.toLowerCase()
    if (seen.has(lower)) continue
    seen.add(lower)
    if (!needle) {
      prefixMatches.push(item)
      continue
    }
    if (lower === needle) continue
    if (lower.startsWith(needle)) prefixMatches.push(item)
    else if (lower.includes(needle)) substringMatches.push(item)
  }
  return [...prefixMatches, ...substringMatches].slice(0, limit)
}

function isIdentChar(ch: string): boolean {
  return (
    (ch >= "a" && ch <= "z") ||
    (ch >= "A" && ch <= "Z") ||
    (ch >= "0" && ch <= "9") ||
    ch === "_"
  )
}

// Slash command names also allow `-`, since the slash registry permits it
// (`/run-foo` style). Hyphens cannot appear in a SQL identifier so the two
// matchers stay distinct.
function isCommandChar(ch: string): boolean {
  return isIdentChar(ch) || ch === "-"
}
