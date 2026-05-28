// Lightweight SQL tokenizer used to drive syntax highlighting and word-based
// suggestions in the query editor. It is intentionally permissive — it scans
// for common SQL lexical categories and falls through to `identifier` for
// anything it does not recognise, which is enough for visual hinting.

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

export interface SqlToken {
  type: SqlTokenType
  start: number
  end: number
  text: string
}

// Reserved words common to PostgreSQL / MySQL / SQLite. Kept lowercase; the
// tokenizer matches case-insensitively.
export const SQL_KEYWORDS = [
  "add", "all", "alter", "and", "as", "asc", "begin", "between", "by",
  "case", "cast", "check", "column", "commit", "constraint", "create",
  "cross", "database", "default", "delete", "desc", "distinct", "do",
  "drop", "else", "end", "exists", "explain", "false", "fetch", "for",
  "foreign", "from", "full", "function", "grant", "group", "having",
  "if", "ilike", "in", "index", "inner", "insert", "into", "is", "join",
  "key", "left", "like", "limit", "not", "null", "offset", "on", "or",
  "order", "outer", "primary", "procedure", "references", "returning",
  "right", "rollback", "schema", "select", "set", "table", "then", "to",
  "transaction", "trigger", "true", "truncate", "union", "unique",
  "update", "using", "values", "view", "when", "where", "with",
]

export const SQL_TYPES = [
  "bigint", "bigserial", "bit", "boolean", "bytea", "char", "character",
  "date", "datetime", "decimal", "double", "float", "int", "int2", "int4",
  "int8", "integer", "interval", "json", "jsonb", "money", "numeric",
  "real", "serial", "smallint", "text", "time", "timestamp", "timestamptz",
  "uuid", "varchar", "varying", "xml",
]

export const SQL_BUILTINS = [
  "avg", "coalesce", "concat", "count", "current_date", "current_time",
  "current_timestamp", "date_part", "date_trunc", "extract", "greatest",
  "least", "length", "lower", "max", "min", "now", "nullif", "round",
  "sum", "to_char", "to_date", "to_number", "to_timestamp", "trim",
  "upper",
]

const KEYWORD_SET = new Set(SQL_KEYWORDS)
const TYPE_SET = new Set(SQL_TYPES)
const BUILTIN_SET = new Set(SQL_BUILTINS)

// Order matters: comments and strings must be tried before bare identifiers
// so a `--` line does not get classified as two operator tokens.
export function tokenizeSql(text: string): SqlToken[] {
  const tokens: SqlToken[] = []
  const len = text.length
  let i = 0

  while (i < len) {
    const ch = text[i]!

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

    // -- line comment
    if (ch === "-" && text[i + 1] === "-") {
      const start = i
      while (i < len && text[i] !== "\n") i++
      tokens.push({ type: "comment", start, end: i, text: text.slice(start, i) })
      continue
    }

    // /* block comment */
    if (ch === "/" && text[i + 1] === "*") {
      const start = i
      i += 2
      while (i < len && !(text[i] === "*" && text[i + 1] === "/")) i++
      if (i < len) i += 2
      tokens.push({ type: "comment", start, end: i, text: text.slice(start, i) })
      continue
    }

    // 'string' or "quoted identifier" — both highlighted as string for simplicity.
    if (ch === "'" || ch === '"' || ch === "`") {
      const quote = ch
      const start = i
      i++
      while (i < len) {
        if (text[i] === "\\" && i + 1 < len) {
          i += 2
          continue
        }
        // SQL doubles the quote to escape; treat that as part of the literal.
        if (text[i] === quote && text[i + 1] === quote) {
          i += 2
          continue
        }
        if (text[i] === quote) {
          i++
          break
        }
        i++
      }
      tokens.push({ type: "string", start, end: i, text: text.slice(start, i) })
      continue
    }

    // numbers: 123, 1.5, .5, 1e10
    if (isDigit(ch) || (ch === "." && isDigit(text[i + 1] ?? ""))) {
      const start = i
      while (i < len && (isDigit(text[i]!) || text[i] === ".")) i++
      if (i < len && (text[i] === "e" || text[i] === "E")) {
        i++
        if (text[i] === "+" || text[i] === "-") i++
        while (i < len && isDigit(text[i]!)) i++
      }
      tokens.push({ type: "number", start, end: i, text: text.slice(start, i) })
      continue
    }

    // identifiers / keywords
    if (isIdentStart(ch)) {
      const start = i
      while (i < len && isIdentPart(text[i]!)) i++
      const word = text.slice(start, i)
      const lower = word.toLowerCase()
      let type: SqlTokenType = "identifier"
      if (KEYWORD_SET.has(lower)) type = "keyword"
      else if (TYPE_SET.has(lower)) type = "type"
      else if (BUILTIN_SET.has(lower)) {
        // Treat as builtin only when followed by `(` to avoid false positives
        // on column names like `count`.
        let j = i
        while (j < len && (text[j] === " " || text[j] === "\t")) j++
        type = text[j] === "(" ? "builtin" : "identifier"
      }
      tokens.push({ type, start, end: i, text: word })
      continue
    }

    // punctuation
    if (ch === "(" || ch === ")" || ch === "," || ch === ";" || ch === ".") {
      tokens.push({ type: "punctuation", start: i, end: i + 1, text: ch })
      i++
      continue
    }

    // operators: =, <, >, <=, >=, <>, !=, +, -, *, /, %, ||, ::
    if (isOperatorChar(ch)) {
      const start = i
      while (i < len && isOperatorChar(text[i]!)) i++
      tokens.push({ type: "operator", start, end: i, text: text.slice(start, i) })
      continue
    }

    // whitespace / unknown — skip a single byte.
    i++
  }

  return tokens
}

function isDigit(ch: string): boolean {
  return ch >= "0" && ch <= "9"
}

function isIdentStart(ch: string): boolean {
  return (ch >= "a" && ch <= "z") || (ch >= "A" && ch <= "Z") || ch === "_"
}

function isIdentPart(ch: string): boolean {
  return isIdentStart(ch) || isDigit(ch) || ch === "$"
}

function isOperatorChar(ch: string): boolean {
  return "+-*/%=<>!|&~^:".includes(ch)
}
