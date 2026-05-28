import { useTerminalDimensions } from "@opentui/react";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import { colors } from "../theme";
import type { SqlSuggestion } from "./sql/sql-suggest";

export interface PopupItem {
  label: string;
  kind: SqlSuggestion["kind"];
}

export interface PopupState {
  items: PopupItem[];
  selectedIndex: number;
  // Absolute screen position of the cursor — popup opens directly below it (or
  // flips above when there isn't room).
  cursorX: number;
  cursorY: number;
}

interface PopupContextValue {
  setPopup: (state: PopupState | null) => void;
}

const PopupContext = createContext<PopupContextValue | null>(null);

const MAX_VISIBLE_ROWS = 8;

const KIND_COLOR: Record<SqlSuggestion["kind"], string> = {
  keyword: colors.panelQuery,
  type: colors.panelResult,
  builtin: colors.panelQueries,
  table: colors.command,
  column: colors.success,
  command: colors.command,
};

export function useSuggestionPopup(): PopupContextValue {
  const ctx = useContext(PopupContext);
  if (!ctx)
    throw new Error("useSuggestionPopup must be used within SuggestionPopupProvider");
  return ctx;
}

export function SuggestionPopupProvider({ children }: { children: ReactNode }) {
  const [popup, setPopupState] = useState<PopupState | null>(null);
  const setPopup = useCallback((state: PopupState | null) => {
    // Bail when transitioning null→null so cursor-only refreshes (no popup)
    // don't churn an extra render.
    setPopupState((prev) => (prev === null && state === null ? prev : state));
  }, []);
  const value = useMemo<PopupContextValue>(() => ({ setPopup }), [setPopup]);
  return (
    <PopupContext.Provider value={value}>
      {children}
      <PopupHost popup={popup} />
    </PopupContext.Provider>
  );
}

function PopupHost({ popup }: { popup: PopupState | null }) {
  const { width: termWidth, height: termHeight } = useTerminalDimensions();
  if (!popup || popup.items.length === 0) return null;

  const { items, selectedIndex, cursorX, cursorY } = popup;

  const maxRows = Math.min(MAX_VISIBLE_ROWS, items.length);
  // Window the visible slice so the highlighted item stays in view when the
  // list is taller than the cap.
  const windowStart = Math.max(
    0,
    Math.min(
      selectedIndex - Math.floor(maxRows / 2),
      Math.max(0, items.length - maxRows),
    ),
  );
  const visible = items.slice(windowStart, windowStart + maxRows);

  const longestLabel = visible.reduce((n, v) => Math.max(n, v.label.length), 0);
  // 2 chars prefix ("› " or "  ") + 2 chars border
  const boxWidth = longestLabel + 2 + 2;
  // Items + top + bottom border
  const boxHeight = maxRows + 2;

  // Open downward by default; flip above the cursor when the bottom would
  // run off the terminal and there's room above.
  const roomBelow = termHeight - (cursorY + 1);
  const openUp = roomBelow < boxHeight && cursorY - boxHeight >= 0;
  const top = openUp
    ? Math.max(0, cursorY - boxHeight)
    : Math.min(cursorY + 1, Math.max(0, termHeight - boxHeight));
  const left = Math.max(0, Math.min(cursorX, termWidth - boxWidth));

  return (
    <box
      position="absolute"
      left={left}
      top={top}
      zIndex={1000}
      borderStyle="rounded"
      borderColor={colors.panelQuery}
      backgroundColor={colors.surfaceAlt}
      flexDirection="column"
    >
      {visible.map((item, i) => {
        const absIdx = windowStart + i;
        const isSelected = absIdx === selectedIndex;
        return (
          <text
            key={`${item.kind}:${absIdx}:${item.label}`}
            fg={isSelected ? colors.selectedFg : KIND_COLOR[item.kind]}
            bg={isSelected ? colors.selectedBg : undefined}
          >
            {(isSelected ? "› " : "  ") + item.label}
          </text>
        );
      })}
    </box>
  );
}
