import {
  defaultTextareaKeyBindings,
  type TextareaRenderable,
} from "@opentui/core";
import { useKeyboard } from "@opentui/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { DriverKind } from "../drivers/types";
import { useQueries } from "../queries-context";
import { useSchema } from "../schema-context";
import { colors } from "../theme";
import { quoteIdentifier } from "./sql/quote-identifier";
import {
  enrichTokensWithSchema,
  extractQueryContext,
  type SchemaIndex,
} from "./sql/sql-context";
import {
  getCommandSuggestions,
  getSuggestions,
  qualifierBefore,
  slashWordAtCursor,
  wordAtCursor,
  type CurrentWord,
  type SchemaSuggestions,
  type SqlSuggestion,
} from "./sql/sql-suggest";
import { createSqlSyntaxStyle, resolveTokenStyleIds } from "./sql/sql-syntax";
import { tokenizeSql } from "./sql/sql-tokens";
import { useSuggestionPopup } from "./suggestion-popup";

export interface RunInfo {
  status: "ok" | "warn" | "error";
  text: string;
}

interface QueryEditorProps {
  textareaRef: (el: TextareaRenderable | null) => void;
  focused: boolean;
  onSubmit: () => void;
  onRunCommand: (name: string) => void;
  height: number;
  commandNames: string[];
  runInfo?: RunInfo | null;
}

const RUN_INFO_COLOR: Record<RunInfo["status"], string> = {
  ok: colors.success,
  warn: colors.warning,
  error: colors.error,
};

export function QueryEditor({
  textareaRef,
  focused,
  onSubmit,
  onRunCommand,
  height,
  commandNames,
  runInfo,
}: QueryEditorProps) {
  const { activeQuery } = useQueries();
  const { setPopup } = useSuggestionPopup();
  const internalRef = useRef<TextareaRenderable | null>(null);
  const syntaxStyle = useMemo(() => createSqlSyntaxStyle(), []);
  const styleIds = useMemo(
    () => resolveTokenStyleIds(syntaxStyle),
    [syntaxStyle],
  );
  const [suggestions, setSuggestions] = useState<SqlSuggestion[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  // Absolute screen position of the textarea's cursor — published to the popup
  // host so the floating list anchors right under the caret.
  const [anchor, setAnchor] = useState<{ x: number; y: number } | null>(null);
  // Mirror the latest word, list, and cursor in refs so the global key handler
  // can act on whatever the user currently sees without waiting for renders.
  const wordRef = useRef<CurrentWord | null>(null);
  const suggestionsRef = useRef<SqlSuggestion[]>([]);
  const selectedIndexRef = useRef(0);
  selectedIndexRef.current = selectedIndex;

  const { tablesState, columnsCache, driverKind, ensureColumns } = useSchema();
  // Two views over the same schema state: the suggestion source carries
  // per-table column lists so `alias.<col>` can resolve, and the highlight
  // index lower-cases names for fast token reclassification.
  const { suggestionSource, highlightIndex, tableLookup } = useMemo(() => {
    const tables = tablesState.kind === "loaded" ? tablesState.tables : [];
    const columnSet = new Set<string>();
    const columnsByTable: Record<string, string[]> = {};
    for (const [table, entry] of Object.entries(columnsCache)) {
      if (entry.kind === "loaded") {
        columnsByTable[table] = entry.columns.map((c) => c.name);
        for (const col of entry.columns) columnSet.add(col.name);
      }
    }
    const tableLookup = new Map<string, string>();
    for (const t of tables) tableLookup.set(t.toLowerCase(), t);
    return {
      suggestionSource: {
        tables,
        columns: Array.from(columnSet),
        columnsByTable,
      } satisfies SchemaSuggestions,
      highlightIndex: {
        tableSet: new Set(tables.map((t) => t.toLowerCase())),
        columnSet: new Set(Array.from(columnSet, (c) => c.toLowerCase())),
      } satisfies SchemaIndex,
      tableLookup,
    };
  }, [tablesState, columnsCache]);
  // Stash the latest views in refs so the stable callbacks can read them
  // without re-binding (which would cascade through every useCallback dep).
  const suggestionSourceRef = useRef(suggestionSource);
  suggestionSourceRef.current = suggestionSource;
  const highlightIndexRef = useRef(highlightIndex);
  highlightIndexRef.current = highlightIndex;
  const tableLookupRef = useRef(tableLookup);
  tableLookupRef.current = tableLookup;
  const ensureColumnsRef = useRef(ensureColumns);
  ensureColumnsRef.current = ensureColumns;
  const driverKindRef = useRef(driverKind);
  driverKindRef.current = driverKind;
  const commandNamesRef = useRef(commandNames);
  commandNamesRef.current = commandNames;
  const onRunCommandRef = useRef(onRunCommand);
  onRunCommandRef.current = onRunCommand;

  // Pre-warm the column cache for any table the user is FROM/JOINing. Cheap
  // because the schema provider dedupes by table name — repeat calls are
  // no-ops once a fetch is in flight or cached.
  const requestReferencedColumns = useCallback((text: string) => {
    const ctx = extractQueryContext(text);
    const lookup = tableLookupRef.current;
    for (const ref of ctx.tables) {
      const canonical = lookup.get(ref.toLowerCase());
      if (canonical) ensureColumnsRef.current(canonical);
    }
  }, []);

  const refresh = useCallback((el: TextareaRenderable) => {
    const text = el.plainText;
    const cursor = el.cursorOffset;
    // `.x`/`.y` are cumulative (root-relative) screen coords in OpenTUI, and
    // visualCursor is viewport-relative within the textarea — summing them
    // gives the caret's absolute screen position for popup anchoring.
    const vc = el.visualCursor;
    setAnchor({ x: el.x + vc.visualCol, y: el.y + vc.visualRow });
    // Slash-command completion takes precedence: when the cursor sits inside a
    // statement-leading `/word`, the user is composing a command, not SQL, so
    // SQL suggestions would be noise.
    const slashWord = slashWordAtCursor(text, cursor);
    if (slashWord) {
      const matches = getCommandSuggestions(
        slashWord.text,
        commandNamesRef.current,
      );
      wordRef.current = slashWord;
      suggestionsRef.current = matches;
      selectedIndexRef.current = 0;
      setSuggestions(matches);
      setSelectedIndex(0);
      return;
    }
    let word = wordAtCursor(text, cursor);
    // Look at the dot that precedes either the in-progress word or the bare
    // cursor position — this lets `alias.` (with cursor immediately after the
    // dot) trigger column completion before any character has been typed.
    const qualifier = word
      ? qualifierBefore(text, word.start)
      : qualifierBefore(text, cursor);
    if (!word && qualifier) {
      word = { text: "", start: cursor, end: cursor };
    }
    wordRef.current = word;
    if (!word) {
      suggestionsRef.current = [];
      selectedIndexRef.current = 0;
      setSuggestions([]);
      setSelectedIndex(0);
      return;
    }
    const ctx = extractQueryContext(text);
    const matches = getSuggestions(word.text, suggestionSourceRef.current, {
      qualifier,
      aliasMap: ctx.aliasMap,
    });
    suggestionsRef.current = matches;
    selectedIndexRef.current = 0;
    setSuggestions(matches);
    setSelectedIndex(0);
  }, []);

  const reapplyHighlights = useCallback(
    (el: TextareaRenderable) => {
      applyHighlights(el, styleIds, highlightIndexRef.current);
    },
    [styleIds],
  );

  // When the schema cache gains new tables/columns (or the registered slash
  // commands change), re-run highlights and suggestions for the current cursor
  // word so the panel reflects the wider candidate set without requiring a
  // keystroke.
  useEffect(() => {
    const el = internalRef.current;
    if (!el) return;
    reapplyHighlights(el);
    refresh(el);
  }, [
    suggestionSource,
    highlightIndex,
    commandNames,
    reapplyHighlights,
    refresh,
  ]);

  // The textarea is mounted by the host via callback ref. We need our own
  // handle as well so we can react to content/cursor changes — forward to the
  // parent while also stashing the renderable locally.
  const attachRef = useCallback(
    (el: TextareaRenderable | null) => {
      internalRef.current = el;
      textareaRef(el);
      if (el) {
        el.syntaxStyle = syntaxStyle;
        reapplyHighlights(el);
        refresh(el);
        requestReferencedColumns(el.plainText);
      }
    },
    [
      textareaRef,
      syntaxStyle,
      reapplyHighlights,
      refresh,
      requestReferencedColumns,
    ],
  );

  // Reset highlights / suggestions whenever the buffer text changes. Re-running
  // the whole tokenizer is cheap relative to the rest of the redraw and lets
  // us avoid incremental bookkeeping.
  const handleContentChange = useCallback(() => {
    const el = internalRef.current;
    if (!el) return;
    reapplyHighlights(el);
    refresh(el);
    requestReferencedColumns(el.plainText);
  }, [reapplyHighlights, refresh, requestReferencedColumns]);

  const handleCursorChange = useCallback(() => {
    const el = internalRef.current;
    if (!el) return;
    refresh(el);
  }, [refresh]);

  // While the suggestion panel has items, up/down move the selection and
  // return/tab accept it — the textarea never sees those keys. Global
  // useKeyboard listeners fire before the focused renderable's
  // handleKeyPress, so calling preventDefault stops the textarea from also
  // receiving the keypress.
  useKeyboard((key) => {
    if (!focused) return;
    if (key.shift || key.ctrl || key.meta) return;
    const list = suggestionsRef.current;
    if (list.length === 0) return;

    if (key.name === "up") {
      key.preventDefault();
      const next = (selectedIndexRef.current - 1 + list.length) % list.length;
      selectedIndexRef.current = next;
      setSelectedIndex(next);
      return;
    }
    if (key.name === "down") {
      key.preventDefault();
      const next = (selectedIndexRef.current + 1) % list.length;
      selectedIndexRef.current = next;
      setSelectedIndex(next);
      return;
    }
    if (key.name === "tab" || key.name === "return" || key.name === "kpenter") {
      const el = internalRef.current;
      const word = wordRef.current;
      const suggestion = list[selectedIndexRef.current];
      if (!el || !word || !suggestion) return;
      const isEnter = key.name === "return" || key.name === "kpenter";
      // Enter on a slash command runs it immediately and drops the partial
      // `/word` from the buffer — Tab still just accepts the completion so
      // users can edit before submitting.
      if (isEnter && suggestion.kind === "command") {
        key.preventDefault();
        deleteRange(el, word);
        suggestionsRef.current = [];
        selectedIndexRef.current = 0;
        setSuggestions([]);
        setSelectedIndex(0);
        onRunCommandRef.current(suggestion.text);
        return;
      }
      key.preventDefault();
      const replacement = insertionForm(suggestion, driverKindRef.current);
      // Typing the full token already (e.g. `/exit` with cursor at the end)
      // makes accept a no-op and traps the user — first press just dismisses
      // so the next Enter can reach the textarea / submit handler.
      if (word.text === replacement) {
        suggestionsRef.current = [];
        selectedIndexRef.current = 0;
        setSuggestions([]);
        setSelectedIndex(0);
        return;
      }
      acceptSuggestion(el, word, replacement);
    }
  });

  useEffect(() => {
    return () => {
      syntaxStyle.destroy();
    };
  }, [syntaxStyle]);

  // Publish the current suggestion list to the root-level popup host. Hiding
  // when the editor isn't focused keeps the popup from lingering over modals
  // and other screens.
  useEffect(() => {
    if (!focused || suggestions.length === 0 || !anchor) {
      setPopup(null);
      return;
    }
    setPopup({
      items: suggestions.map((s) => ({
        label: insertionForm(s, driverKind),
        kind: s.kind,
      })),
      selectedIndex,
      cursorX: anchor.x,
      cursorY: anchor.y,
    });
  }, [focused, suggestions, selectedIndex, anchor, driverKind, setPopup]);

  // Belt-and-suspenders: drop the popup if the editor unmounts mid-suggestion.
  useEffect(() => {
    return () => {
      setPopup(null);
    };
  }, [setPopup]);

  return (
    <box
      borderStyle="rounded"
      borderColor={colors.panelQuery}
      title={` ${activeQuery?.name ?? "New query"} `}
      titleAlignment="left"
      padding={1}
      flexDirection="column"
      height={height}
      flexShrink={0}
    >
      <textarea
        ref={attachRef}
        width="100%"
        flexGrow={1}
        flexShrink={1}
        minHeight={1}
        placeholder="-- SQL or /command · F5 / Ctrl+R to run"
        placeholderColor={colors.textMuted}
        focused={focused}
        keyBindings={[
          // Drop the library's Alt+Enter→submit defaults; run is F5 / Ctrl+R
          // only, so the run key behaves identically across every terminal.
          ...defaultTextareaKeyBindings.filter((b) => b.action !== "submit"),
          { name: "f5", action: "submit" },
          { name: "r", ctrl: true, action: "submit" },
        ]}
        onSubmit={onSubmit}
        onContentChange={handleContentChange}
        onCursorChange={handleCursorChange}
      />
      {runInfo ? (
        <box
          flexDirection="row"
          width="100%"
          justifyContent="flex-end"
          flexShrink={0}
        >
          <text fg={RUN_INFO_COLOR[runInfo.status]}>{runInfo.text}</text>
        </box>
      ) : null}
    </box>
  );
}

// Display + Tab-accept use the same string so users see exactly what will be
// inserted. Schema-aware kinds (table/column) get driver-appropriate quoting;
// SQL keywords and builtins pass through unchanged.
function insertionForm(
  suggestion: SqlSuggestion,
  kind: DriverKind | null,
): string {
  if (!kind) return suggestion.text;
  if (suggestion.kind !== "table" && suggestion.kind !== "column")
    return suggestion.text;
  return quoteIdentifier(kind, suggestion.text);
}

function applyHighlights(
  el: TextareaRenderable,
  styleIds: Record<string, number>,
  schema: SchemaIndex,
): void {
  el.clearAllHighlights();
  const text = el.plainText;
  if (!text) return;
  const tokens = enrichTokensWithSchema(tokenizeSql(text), schema);
  // opentui's addHighlightByCharRange uses an offset space that excludes
  // newline characters, while our tokenizer indexes into plainText where each
  // `\n` is 1 char. Without translation, every line crossing drifts the
  // highlight one character to the right.
  const newlinesBefore = buildNewlinePrefixCounts(text);
  for (const token of tokens) {
    const styleId = styleIds[token.type];
    if (!styleId) continue;
    el.addHighlightByCharRange({
      start: token.start - newlinesBefore[token.start]!,
      end: token.end - newlinesBefore[token.end]!,
      styleId,
    });
  }
}

// Returns an array `n` where `n[i]` is the count of `\n` characters in
// `text[0..i)` — i.e. how many newlines precede offset `i`. Length is
// `text.length + 1` so callers can index by the exclusive `end` offset too.
function buildNewlinePrefixCounts(text: string): number[] {
  const counts = new Array<number>(text.length + 1);
  let n = 0;
  for (let i = 0; i < text.length; i++) {
    counts[i] = n;
    if (text[i] === "\n") n++;
  }
  counts[text.length] = n;
  return counts;
}

function acceptSuggestion(
  el: TextareaRenderable,
  word: CurrentWord,
  replacement: string,
): void {
  deleteRange(el, word);
  el.insertText(replacement);
}

function deleteRange(el: TextareaRenderable, word: CurrentWord): void {
  const buffer = el.editBuffer;
  const start = buffer.offsetToPosition(word.start);
  const end = buffer.offsetToPosition(word.end);
  if (!start || !end) return;
  el.deleteRange(start.row, start.col, end.row, end.col);
  // deleteRange does not guarantee where the cursor lands across versions, so
  // anchor it explicitly at the start of the now-empty range.
  buffer.setCursorByOffset(word.start);
}
