import type { TextareaRenderable } from "@opentui/core";
import {
  useKeyboard,
  useRenderer,
  useTerminalDimensions,
} from "@opentui/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AiProvider, useAi } from "../ai-context";
import { extractAiPrompt } from "../ai/extract-ai-prompt";
import {
  AgentLimitError,
  AiConfigError,
  AiRateLimitError,
  type AiStatus,
} from "../ai/types";
import { useApp } from "../app-context";
import type { SlashCommand } from "../commands";
import { Divider } from "../components/divider";
import { HeaderBar } from "../components/header-bar";
import { QueriesPanel } from "../components/queries-panel";
import { QueryEditor, type RunInfo } from "../components/query-editor";
import {
  ResultPanel,
  type ResultState,
  type StatementResult,
} from "../components/result-panel";
import { DEFAULT_ROW_CAP } from "../drivers/types";
import { writeClipboard } from "../lib/clipboard";
import { QueriesProvider, useQueries } from "../queries-context";
import { SchemaProvider } from "../schema-context";
import { useToast } from "../toast-context";
import { AiConfigModal } from "./ai-config-modal";
import { HelpModal } from "./help-modal";
import { InputPromptModal } from "./input-prompt-modal";
import { QuerySwitchModal } from "./query-switch-modal";

const QUERIES_MIN_WIDTH = 20;
const QUERIES_MAX_RATIO = 0.6;
const QUERIES_DEFAULT_RATIO = 0.28;

const EDITOR_MIN_HEIGHT = 6;
const EDITOR_RESERVED_FOR_RESULT = 8;
const EDITOR_DEFAULT_RATIO = 0.4;

export function MainScreen() {
  const { connection, driver } = useApp();
  if (!connection) return null;

  return (
    <SchemaProvider driver={driver}>
      <AiProvider>
        <QueriesProvider connectionId={connection.id}>
          <MainScreenInner />
        </QueriesProvider>
      </AiProvider>
    </SchemaProvider>
  );
}

function MainScreenInner() {
  const {
    driver,
    paletteOpen,
    openPalette,
    setCommands,
    goSelect,
    runSlashCommand,
    confirmRequest,
  } = useApp();
  const {
    activeQuery,
    queries,
    saveAs,
    renameActive,
    deleteActive,
    switchTo,
    clearActive,
    openInputPrompt,
    inputPrompt,
    openSwitchModal,
    switchModalOpen,
  } = useQueries();
  const { state: aiState, requestSql, cancel: cancelAi } = useAi();
  const [aiConfigOpen, setAiConfigOpen] = useState(false);
  const renderer = useRenderer();
  const { showToast } = useToast();
  const { width, height } = useTerminalDimensions();
  const showQueries = width >= 100;
  const queriesMax = Math.max(
    QUERIES_MIN_WIDTH + 4,
    Math.floor(width * QUERIES_MAX_RATIO),
  );
  const [queriesWidth, setQueriesWidth] = useState(() =>
    Math.max(QUERIES_MIN_WIDTH, Math.floor(width * QUERIES_DEFAULT_RATIO)),
  );
  const clampedQueriesWidth = Math.min(
    queriesMax,
    Math.max(QUERIES_MIN_WIDTH, queriesWidth),
  );

  const editorMax = Math.max(
    EDITOR_MIN_HEIGHT + 4,
    height - EDITOR_RESERVED_FOR_RESULT,
  );
  const [editorHeight, setEditorHeight] = useState(() =>
    Math.max(EDITOR_MIN_HEIGHT, Math.floor(height * EDITOR_DEFAULT_RATIO)),
  );
  const clampedEditorHeight = Math.min(
    editorMax,
    Math.max(EDITOR_MIN_HEIGHT, editorHeight),
  );

  const textareaRef = useRef<TextareaRenderable | null>(null);
  const [result, setResult] = useState<ResultState>({ kind: "idle" });
  const [runInfo, setRunInfo] = useState<RunInfo | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);

  // commandsRef lets the textarea handler see the latest registered commands
  // without re-binding the submit handler on every state change.
  const commandsRef = useRef<SlashCommand[]>([]);

  // replaceText preserves undo history; falls back to setText on stricter
  // typings. Empty string is fine — clear() and replaceText('') are equivalent.
  const setEditorText = useCallback((text: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.replaceText(text);
  }, []);

  const getEditorText = useCallback(
    () => textareaRef.current?.plainText ?? "",
    [],
  );

  const handleSwitchQuery = useCallback(
    (id: string) => {
      const target = switchTo(id, getEditorText());
      if (target) setEditorText(target.text);
    },
    [switchTo, getEditorText, setEditorText],
  );

  // Shared query runner: executes each statement and renders the results.
  // Used by submit (Enter / F5 / Ctrl+R / Run button) and the /run command.
  const runStatements = useCallback(
    async (statements: string[]) => {
      if (!driver || statements.length === 0) return;
      setResult({ kind: "running" });
      setRunInfo(null);
      const start = performance.now();
      const results: StatementResult[] = [];
      for (const statement of statements) {
        try {
          const queryResult = await driver.query(statement, {
            maxRows: DEFAULT_ROW_CAP,
          });
          results.push({ kind: "ok", statement, result: queryResult });
        } catch (e: any) {
          results.push({
            kind: "error",
            statement,
            message: e?.message ?? String(e),
          });
        }
      }
      const elapsed = performance.now() - start;
      setResult({ kind: "results", results, activeIndex: results.length - 1 });
      setRunInfo(summarizeRun(results, elapsed));
    },
    [driver],
  );

  // Runs the statement block at the cursor — the SQL path of submit, reused by
  // the /run slash command (the "/run" token is stripped before this fires).
  const runEditorQuery = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    void runStatements(extractStatements(ta.plainText, ta.cursorOffset));
  }, [runStatements]);

  const runAiBlock = useCallback(async () => {
    const ta = textareaRef.current;
    if (!ta) return;
    const text = ta.plainText;
    const cursor = ta.cursorOffset;
    const { blockText, blockStart } = extractBlockAtCursor(text, cursor);
    const match = extractAiPrompt(blockText, blockStart);
    if (!match) return;

    setRunInfo({ status: "ok", text: "⟳ AI thinking…" });

    const onStatus = (s: AiStatus) => {
      if (s.kind === "thinking") {
        setRunInfo({ status: "ok", text: "⟳ AI thinking…" });
      } else {
        setRunInfo({
          status: "ok",
          text: `⟳ ${s.tool}${formatToolArgs(s.args)}…`,
        });
      }
    };

    try {
      const sql = await requestSql({
        prompt: match.prompt,
        blockContext: match.blockContext,
        onStatus,
      });
      replaceEditorRange(ta, match.range, `--- @ai: ${match.prompt}\n${sql}`);
      setRunInfo({ status: "ok", text: "✓ AI replaced @ai block" });
    } catch (e) {
      if ((e as DOMException)?.name === "AbortError") {
        setRunInfo(null);
        return;
      }
      if (e instanceof AiConfigError) {
        setRunInfo({ status: "error", text: `✗ ${e.message}` });
        showToast("Run /ai-config to set up your AI adapter", {
          kind: "error",
        });
        return;
      }
      if (e instanceof AgentLimitError) {
        setRunInfo({
          status: "error",
          text: `✗ AI gave up after ${e.iterations} tool calls`,
        });
        return;
      }
      if (e instanceof AiRateLimitError) {
        setRunInfo({ status: "error", text: "✗ AI rate limited — try again" });
        return;
      }
      const message = e instanceof Error ? e.message : String(e);
      setRunInfo({ status: "error", text: `✗ AI error: ${message}` });
    }
  }, [requestSql, showToast]);

  const cmds = useMemo<SlashCommand[]>(
    () => [
      {
        name: "/run",
        description: "Execute the current query",
        handler: () => runEditorQuery(),
      },
      {
        name: "/commands",
        description: "Open the command palette",
        handler: () => openPalette(),
      },
      {
        name: "/help",
        description: "Show keyboard shortcuts",
        handler: () => setHelpOpen(true),
      },
      {
        name: "/ai-config",
        description: "Pick an AI adapter and model for @ai prompts",
        handler: () => setAiConfigOpen(true),
      },
      {
        name: "/ask-ai",
        description: "Insert @ai: at the cursor to start a prompt",
        handler: () => {
          textareaRef.current?.insertText("@ai: ");
        },
      },
      {
        name: "/exit",
        description: "Disconnect and return to connection select",
        confirm: {
          title: "Exit session",
          message: "Disconnect and return to connection select?",
        },
        handler: () => goSelect(),
      },
      // {
      //   name: "/undo",
      //   description: "Undo the last edit in the query editor",
      //   handler: () => {
      //     textareaRef.current?.editBuffer.undo()
      //   },
      // },
      {
        name: "/save-query",
        description: "Save the current query under a name",
        handler: () => {
          const text = getEditorText();
          openInputPrompt({
            title: "Save query",
            placeholder: "Query name",
            initialValue: activeQuery?.name ?? "",
            onConfirm: (name) => {
              saveAs(name, text);
            },
          });
        },
      },
      {
        name: "/new-query",
        description: "Start a new empty query",
        handler: () => {
          clearActive(getEditorText());
          setEditorText("");
        },
      },
      {
        name: "/rename-query",
        description: "Rename the active query",
        handler: () => {
          if (!activeQuery) return;
          openInputPrompt({
            title: "Rename query",
            placeholder: "New name",
            initialValue: activeQuery.name,
            onConfirm: (name) => {
              renameActive(name);
            },
          });
        },
      },
      {
        name: "/delete-query",
        description: "Delete the active query",
        confirm: {
          title: "Delete query",
          message: "Delete the active query?",
        },
        handler: () => {
          const fallback = deleteActive();
          setEditorText(fallback?.text ?? "");
        },
      },
      {
        name: "/switch-query",
        description: "Switch to another saved query",
        handler: () => {
          if (queries.length === 0) return;
          openSwitchModal();
        },
      },
    ],
    [
      runEditorQuery,
      openPalette,
      goSelect,
      getEditorText,
      setEditorText,
      openInputPrompt,
      openSwitchModal,
      saveAs,
      clearActive,
      renameActive,
      deleteActive,
      activeQuery,
      queries.length,
    ],
  );
  const commandNames = useMemo(() => cmds.map((c) => c.name), [cmds]);

  useEffect(() => {
    commandsRef.current = cmds;
    setCommands(cmds);
    return () => {
      commandsRef.current = [];
      setCommands([]);
    };
  }, [cmds, setCommands]);

  const modalOpen =
    paletteOpen ||
    !!confirmRequest ||
    !!inputPrompt ||
    switchModalOpen ||
    helpOpen ||
    aiConfigOpen;

  useKeyboard((key) => {
    if (modalOpen) return;
    // F9 opens the command palette in every terminal. Ctrl+P stays as an alias,
    // but VSCode's terminal grabs it for "Quick Open", so F9 is the reliable key.
    if (key.name === "f9" || (key.ctrl && key.name === "p")) {
      openPalette();
      return;
    }
    // F1 opens help in every terminal; Ctrl+H also works where Kitty is active
    // (legacy terminals send Ctrl+H as Backspace, so it falls through there).
    if (key.name === "f1" || (key.ctrl && key.name === "h")) {
      setHelpOpen(true);
      return;
    }
    // Ctrl+Y copies the current renderer-level selection, which spans any
    // selectable text in the app (query editor + result panel + anything else
    // selectable). Uses the OS-native clipboard writer because OSC52 doesn't
    // reach most desktop clipboards on Windows. No selection → no-op.
    if (key.ctrl && key.name === "y") {
      const selection = renderer.getSelection();
      if (!selection) return;
      const text = selection.getSelectedText();
      if (!text) return;
      void writeClipboard(text).then((ok) => {
        showToast(ok ? "Copied to clipboard" : "Copy failed", {
          kind: ok ? "success" : "error",
        });
      });
      return;
    }
    if (key.name === "escape" && aiState === "running") {
      cancelAi();
      return;
    }
  });

  const handleSelectTab = (index: number) => {
    setResult((prev) =>
      prev.kind === "results" ? { ...prev, activeIndex: index } : prev,
    );
  };

  const handleSubmit = async () => {
    const ta = textareaRef.current;
    if (!ta || !driver) return;

    const text = ta.plainText;
    const cursor = ta.cursorOffset;

    const { blockText, blockStart } = extractBlockAtCursor(text, cursor);
    if (extractAiPrompt(blockText, blockStart)) {
      if (aiState === "running") return;
      await runAiBlock();
      return;
    }

    const statements = extractStatements(text, cursor);
    if (statements.length === 0) return;

    // Slash commands: only the first statement is interpreted as a command.
    const first = statements[0]!;
    if (first.startsWith("/")) {
      const cmdName = first.split(/\s+/)[0]!;
      const known = commandsRef.current.find((c) => c.name === cmdName);
      if (known) {
        await runSlashCommand(cmdName);
      } else {
        setResult({
          kind: "results",
          activeIndex: 0,
          results: [
            {
              kind: "error",
              statement: first,
              message: `Unknown command: ${cmdName}`,
            },
          ],
        });
      }
      return;
    }

    await runStatements(statements);
  };

  return (
    <>
      <box flexDirection="column" width="100%" height="100%">
        <HeaderBar onRun={() => void handleSubmit()} />

        <box flexDirection="row" flexGrow={1}>
          {showQueries ? (
            <>
              <QueriesPanel
                width={clampedQueriesWidth}
                onSelectQuery={handleSwitchQuery}
              />
              <Divider
                orientation="vertical"
                value={clampedQueriesWidth}
                min={QUERIES_MIN_WIDTH}
                max={queriesMax}
                onChange={setQueriesWidth}
              />
            </>
          ) : null}

          <box flexDirection="column" flexGrow={1}>
            <QueryEditor
              textareaRef={(el) => {
                textareaRef.current = el;
              }}
              focused={!modalOpen}
              onSubmit={() => {
                void handleSubmit();
              }}
              onRunCommand={(name) => {
                void runSlashCommand(name);
              }}
              height={clampedEditorHeight}
              commandNames={commandNames}
              runInfo={runInfo}
            />
            <Divider
              orientation="horizontal"
              value={clampedEditorHeight}
              min={EDITOR_MIN_HEIGHT}
              max={editorMax}
              onChange={setEditorHeight}
            />
            <ResultPanel state={result} onSelectTab={handleSelectTab} />
          </box>
        </box>
      </box>
      <InputPromptModal />
      <QuerySwitchModal onSelect={handleSwitchQuery} />
      {helpOpen ? <HelpModal onClose={() => setHelpOpen(false)} /> : null}
      <AiConfigModal
        open={aiConfigOpen}
        onClose={() => setAiConfigOpen(false)}
        onSaved={() => {
          showToast("AI config saved", { kind: "success" });
        }}
      />
    </>
  );
}

/**
 * Extract the SQL statements to execute for the current cursor position.
 *
 * Rules:
 * - A line of 3+ dashes (with optional surrounding whitespace) is a batch
 *   separator. Execution starts at the line after the latest separator above
 *   the cursor's line — letting users carve a buffer into independently
 *   runnable blocks without a visual selection.
 * - If the cursor sits at/right-after a `;` (skipping trailing whitespace),
 *   the boundary is moved onto that `;` so the just-finished statement is
 *   included instead of the empty slice after it.
 * - Everything within the active block is split by `;` and trimmed — empty
 *   pieces are dropped. Multiple `;`-separated queries each become their own
 *   statement (caller runs all of them).
 */
function extractStatements(text: string, cursorOffset: number): string[] {
  const cursor = Math.min(Math.max(cursorOffset, 0), text.length);

  let walker = cursor;
  while (walker > 0 && /\s/.test(text[walker - 1]!)) walker--;

  const blockEnd = walker > 0 && text[walker - 1] === ";" ? walker : cursor;
  const blockStart = findBlockStart(text, cursor);
  if (blockStart >= blockEnd) return [];
  const block = text.slice(blockStart, blockEnd);

  return block
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

// Walk backwards line-by-line from the cursor's line. Returns the offset of
// the first character after the latest separator line above the cursor, or 0
// if no separator is found.
function findBlockStart(text: string, cursor: number): number {
  const cursorLineStart = text.lastIndexOf("\n", cursor - 1) + 1;
  let lineEnd = cursorLineStart - 1;
  while (lineEnd >= 0) {
    const lineStart = text.lastIndexOf("\n", lineEnd - 1) + 1;
    const line = text.slice(lineStart, lineEnd);
    if (/^\s*-{3,}\s*$/.test(line)) return lineEnd + 1;
    if (lineStart === 0) break;
    lineEnd = lineStart - 1;
  }
  return 0;
}

function extractBlockAtCursor(
  text: string,
  cursorOffset: number,
): { blockText: string; blockStart: number } {
  const cursor = Math.min(Math.max(cursorOffset, 0), text.length);
  const blockStart = findBlockStart(text, cursor);
  const blockEnd = findBlockEnd(text, cursor);
  return { blockText: text.slice(blockStart, blockEnd), blockStart };
}

function findBlockEnd(text: string, cursor: number): number {
  let i = cursor;
  while (i < text.length && text[i] !== "\n") i++;
  while (i < text.length) {
    const lineStart = i + 1;
    if (lineStart >= text.length) break;
    let lineEnd = lineStart;
    while (lineEnd < text.length && text[lineEnd] !== "\n") lineEnd++;
    const line = text.slice(lineStart, lineEnd);
    if (/^\s*-{3,}\s*$/.test(line)) return lineStart > 0 ? lineStart - 1 : 0;
    i = lineEnd;
  }
  return text.length;
}

function replaceEditorRange(
  ta: TextareaRenderable,
  range: { start: number; end: number },
  replacement: string,
): void {
  const buffer = ta.editBuffer;
  const start = buffer.offsetToPosition(range.start);
  const end = buffer.offsetToPosition(range.end);
  if (!start || !end) return;
  ta.deleteRange(start.row, start.col, end.row, end.col);
  buffer.setCursorByOffset(range.start);
  ta.insertText(replacement);
}

function formatToolArgs(args: Record<string, unknown>): string {
  const keys = Object.keys(args);
  if (keys.length === 0) return "";
  const first = keys[0]!;
  const value = args[first];
  if (typeof value === "string" || typeof value === "number") {
    return `(${first}: ${value})`;
  }
  return "";
}

// Sub-second runs read in ms; once past a second, seconds are easier to parse.
function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

// Builds the editor's bottom-right run summary. Errors take priority; otherwise
// a single statement reports its row count (returned vs. affected), and a batch
// reports the statement count. Truncated results downgrade the status to "warn".
function summarizeRun(results: StatementResult[], elapsedMs: number): RunInfo {
  const time = formatDuration(elapsedMs);
  if (results.some((r) => r.kind === "error")) {
    return { status: "error", text: `✗ error · ${time}` };
  }
  const truncated = results.some((r) => r.kind === "ok" && r.result.truncated);
  const status = truncated ? "warn" : "ok";
  const only = results.length === 1 ? results[0] : undefined;
  if (only && only.kind === "ok") {
    const { rowCount, columns } = only.result;
    const plural = rowCount === 1 ? "" : "s";
    if (columns.length === 0) {
      return { status, text: `✓ ${rowCount} row${plural} affected · ${time}` };
    }
    const cap = truncated ? "+" : "";
    return { status, text: `✓ ${rowCount}${cap} row${plural} · ${time}` };
  }
  return { status, text: `✓ ${results.length} statements · ${time}` };
}
