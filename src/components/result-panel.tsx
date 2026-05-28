import { SyntaxStyle } from "@opentui/core"
import { useMemo } from "react"
import type { QueryResult } from "../drivers/types"
import { colors } from "../theme"

export type StatementResult =
  | { kind: "ok"; statement: string; result: QueryResult }
  | { kind: "error"; statement: string; message: string }

export type ResultState =
  | { kind: "idle" }
  | { kind: "running" }
  | { kind: "results"; results: StatementResult[]; activeIndex: number }

export function ResultPanel({
  state,
  onSelectTab,
}: {
  state: ResultState
  onSelectTab?: (index: number) => void
}) {
  const showTabs = state.kind === "results" && state.results.length > 1
  const activeIndex = state.kind === "results" ? state.activeIndex : 0

  return (
    <box
      borderStyle="rounded"
      borderColor={colors.panelResult}
      title=" Result "
      titleAlignment="left"
      padding={1}
      flexDirection="column"
      flexGrow={1}
    >
      {showTabs && state.kind === "results" ? (
        <box flexDirection="row" height={1} flexShrink={0} marginBottom={1}>
          {state.results.map((r, i) => (
            <ResultTab
              key={i}
              label={tabLabel(r, i)}
              active={i === activeIndex}
              onClick={() => onSelectTab?.(i)}
            />
          ))}
        </box>
      ) : null}
      <scrollbox
        scrollX
        scrollY
        stickyScroll
        stickyStart="top"
        rootOptions={{ flexGrow: 1 }}
        contentOptions={{ flexDirection: "column", gap: 0 }}
      >
        <ResultView state={state} />
      </scrollbox>
    </box>
  )
}

function ResultTab({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <box
      paddingLeft={1}
      paddingRight={1}
      marginRight={1}
      backgroundColor={active ? colors.selectedBg : undefined}
      onMouseDown={onClick}
    >
      <text fg={active ? colors.selectedFg : colors.textDim}>{label}</text>
    </box>
  )
}

function tabLabel(r: StatementResult, idx: number): string {
  const verb = firstWord(r.statement)
  return verb ? `${idx + 1}. ${verb}` : `Query ${idx + 1}`
}

function firstWord(s: string): string {
  const m = s.trim().match(/^[A-Za-z_][A-Za-z0-9_]*/)
  return m ? m[0].toUpperCase() : ""
}

function ResultView({ state }: { state: ResultState }) {
  const syntaxStyle = useMemo(() => SyntaxStyle.create(), [])

  if (state.kind === "idle") {
    return (
      <>
        <text fg={colors.textDim}>No results yet.</text>
        <text fg={colors.textMuted}>F5 / ctrl+r runs the statement.</text>
      </>
    )
  }
  if (state.kind === "running") {
    return <text fg={colors.warning}>Running...</text>
  }

  const active = state.results[state.activeIndex] ?? state.results[0]
  if (!active) {
    return <text fg={colors.textDim}>No statements to run.</text>
  }

  if (active.kind === "error") {
    const lines = wrapLines(`Error: ${active.message}`, 60)
    return (
      <>
        {lines.map((line, i) => (
          <text key={i} fg={colors.error}>{line}</text>
        ))}
        <text fg={colors.textMuted}>— {trimOneLine(active.statement)}</text>
      </>
    )
  }

  const { columns, rows, rowCount, truncated } = active.result
  if (columns.length === 0) {
    return (
      <>
        <text fg={colors.success}>OK ({rowCount} row{rowCount === 1 ? "" : "s"} affected)</text>
        <text fg={colors.textMuted}>— {trimOneLine(active.statement)}</text>
      </>
    )
  }

  const previewRows = rows.slice(0, 50)
  const markdown = buildMarkdownTable(columns, previewRows)

  return (
    <>
      <text fg={truncated ? colors.warning : colors.success}>
        {rowCount}{truncated ? "+" : ""} row{rowCount === 1 ? "" : "s"}
      </text>
      {truncated ? (
        <text fg={colors.warning}>
          ⚠ Result capped at {rowCount} rows. Add LIMIT/WHERE to narrow the query.
        </text>
      ) : null}
      <markdown
        content={markdown}
        syntaxStyle={syntaxStyle}
        tableOptions={{
          style: "grid",
          widthMode: "content",
          wrapMode: "none",
          borderStyle: "single",
        }}
      />
      {rows.length > previewRows.length ? (
        <text fg={colors.textDim}>… {rows.length - previewRows.length} more fetched rows not shown (scroll-only preview)</text>
      ) : null}
    </>
  )
}

function buildMarkdownTable(columns: string[], rows: unknown[][]): string {
  const header = `| ${columns.map(escapeMdCell).join(" | ")} |`
  const divider = `| ${columns.map(() => "---").join(" | ")} |`
  const body = rows.map(
    (row) =>
      `| ${columns
        .map((_, i) => escapeMdCell(formatCell(row[i])))
        .join(" | ")} |`,
  )
  return [header, divider, ...body].join("\n")
}

function escapeMdCell(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/\|/g, "\\|").replace(/\n/g, " ")
}

function formatCell(v: unknown): string {
  if (v === null || v === undefined) return "NULL"
  if (typeof v === "object") {
    try {
      return JSON.stringify(v)
    } catch {
      return String(v)
    }
  }
  return String(v)
}

function trimOneLine(s: string): string {
  const flat = s.replace(/\s+/g, " ").trim()
  return flat.length > 60 ? flat.slice(0, 57) + "..." : flat
}

function wrapLines(text: string, maxWidth: number): string[] {
  const out: string[] = []
  for (const rawLine of text.split("\n")) {
    if (rawLine.length <= maxWidth) {
      out.push(rawLine)
      continue
    }
    const words = rawLine.split(/(\s+)/)
    let current = ""
    for (const tok of words) {
      if ((current + tok).length > maxWidth && current.length > 0) {
        out.push(current.trimEnd())
        current = tok.trimStart()
      } else {
        current += tok
      }
    }
    if (current.length > 0) out.push(current.trimEnd())
  }
  return out
}
