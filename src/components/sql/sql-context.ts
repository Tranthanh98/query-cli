import { tokenizeSql, type SqlToken, type SqlTokenType } from "./sql-tokens"

export interface QueryContext {
  // Table names referenced via FROM/JOIN, in the order they appear, preserving
  // the casing the user typed so callers can look them up in the schema cache.
  tables: string[]
  // Lower-cased alias (or table name when no alias is given) → original table
  // name. Used by the suggestion engine to resolve `alias.<col>` lookups.
  aliasMap: Record<string, string>
}

// Walk the token stream and pick out FROM/JOIN clauses. We deliberately keep
// the parser shallow — it handles the common shapes (`from t`, `from t a`,
// `from t as a`, comma-separated lists, plain JOINs) and bails on anything
// unfamiliar instead of trying to mirror a full SQL grammar.
export function extractQueryContext(text: string): QueryContext {
  const tokens = tokenizeSql(text)
  const tables: string[] = []
  const aliasMap: Record<string, string> = {}

  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i]!
    if (tok.type !== "keyword") continue
    const kw = tok.text.toLowerCase()
    if (kw !== "from" && kw !== "join") continue

    let j = i + 1
    while (j < tokens.length) {
      const tableTok = tokens[j]
      if (!tableTok || tableTok.type !== "identifier") break
      const tableName = tableTok.text
      tables.push(tableName)
      aliasMap[tableName.toLowerCase()] = tableName
      j++

      // Optional `AS` keyword in front of the alias.
      const asTok = tokens[j]
      if (asTok && asTok.type === "keyword" && asTok.text.toLowerCase() === "as") {
        j++
      }

      // Optional alias — only if it's a bare identifier (skip if the next
      // token is a clause-starter like ON/WHERE/JOIN, which would otherwise
      // get mis-attributed as an alias).
      const aliasTok = tokens[j]
      if (aliasTok && aliasTok.type === "identifier") {
        aliasMap[aliasTok.text.toLowerCase()] = tableName
        j++
      }

      // Comma keeps us inside the same FROM list; anything else ends it.
      const sep = tokens[j]
      if (sep && sep.type === "punctuation" && sep.text === ",") {
        j++
        continue
      }
      break
    }
    i = j - 1
  }

  return { tables, aliasMap }
}

export interface SchemaIndex {
  tableSet: Set<string>   // lower-cased table names
  columnSet: Set<string>  // lower-cased column names across all loaded tables
}

// Re-tag bare identifiers as `table` or `column` based on what the schema
// store currently knows about. Tokens we leave alone if there is no match —
// they remain plain identifiers and render in the default identifier color.
export function enrichTokensWithSchema(
  tokens: SqlToken[],
  schema: SchemaIndex,
): SqlToken[] {
  if (schema.tableSet.size === 0 && schema.columnSet.size === 0) return tokens
  const out: SqlToken[] = new Array(tokens.length)
  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i]!
    if (tok.type !== "identifier") {
      out[i] = tok
      continue
    }
    const lower = tok.text.toLowerCase()
    let nextType: SqlTokenType | null = null
    if (schema.tableSet.has(lower)) nextType = "table"
    else if (schema.columnSet.has(lower)) nextType = "column"
    out[i] = nextType ? { ...tok, type: nextType } : tok
  }
  return out
}
