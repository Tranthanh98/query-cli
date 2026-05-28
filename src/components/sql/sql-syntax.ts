import { SyntaxStyle } from "@opentui/core"
import type { SqlTokenType } from "./sql-tokens"

// Colors are aligned with the project's existing palette in `theme.ts`. Each
// token type maps to a named style; the integer id returned by the buffer is
// resolved once and cached for fast per-keystroke lookups.
const TOKEN_COLORS: Record<SqlTokenType, { fg: string; bold?: boolean; italic?: boolean }> = {
  keyword: { fg: "#B197E6", bold: true }, // violet, matches the query panel accent
  type: { fg: "#7FB3FF" },                // blue
  builtin: { fg: "#6EC4B5" },             // mint-teal
  function: { fg: "#6EC4B5" },
  string: { fg: "#8FE388" },              // green
  number: { fg: "#F0B458" },              // amber
  comment: { fg: "#4A4A52", italic: true },
  operator: { fg: "#E6E6E6" },
  punctuation: { fg: "#7A7A82" },
  identifier: { fg: "#E6E6E6" },
  table: { fg: "#F0B458", bold: true },   // amber, mirrors the table suggestion chip
  column: { fg: "#8FE388" },              // green, mirrors the column suggestion chip
  "ai-directive": { fg: "#F0B458", bold: true },
}

export const SQL_TOKEN_TYPES = Object.keys(TOKEN_COLORS) as SqlTokenType[]

export function createSqlSyntaxStyle(): SyntaxStyle {
  const defs: Record<string, { fg: string; bold?: boolean; italic?: boolean }> = {}
  for (const type of SQL_TOKEN_TYPES) defs[type] = TOKEN_COLORS[type]
  return SyntaxStyle.fromStyles(defs)
}

export function resolveTokenStyleIds(
  style: SyntaxStyle,
): Record<SqlTokenType, number> {
  const map = {} as Record<SqlTokenType, number>
  for (const type of SQL_TOKEN_TYPES) {
    const id = style.getStyleId(type)
    map[type] = id ?? 0
  }
  return map
}
