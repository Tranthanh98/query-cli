import type { SelectOption } from "@opentui/core";
import { useKeyboard, useTerminalDimensions } from "@opentui/react";
import { useQueries } from "../queries-context";
import { colors } from "../theme";

const MODAL_CHROME_ROWS = 6;
const MODAL_MIN_ROWS = 4;

interface QuerySwitchModalProps {
  /** Called with the chosen query id after the modal closes itself. */
  onSelect: (id: string) => void;
}

export function QuerySwitchModal({ onSelect }: QuerySwitchModalProps) {
  const { queries, switchModalOpen, closeSwitchModal } = useQueries();
  const { height } = useTerminalDimensions();
  const maxRows = Math.max(MODAL_MIN_ROWS, height - MODAL_CHROME_ROWS);

  useKeyboard((key) => {
    if (!switchModalOpen) return;
    if (key.name === "escape") closeSwitchModal();
  });

  if (!switchModalOpen) return null;

  const options: SelectOption[] = queries.map((q) => ({
    name: q.name,
    description: firstLine(q.text) || "(empty)",
    value: q.id,
  }));

  const handleSelect = (_idx: number, opt: SelectOption | null) => {
    if (!opt) return;
    const id = opt.value as string;
    closeSwitchModal();
    onSelect(id);
  };

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
        borderColor={colors.panelQueries}
        padding={1}
        title=" Switch query "
        titleAlignment="left"
        flexDirection="column"
        gap={1}
        backgroundColor={colors.surfaceAlt}
      >
        <box flexDirection="row" gap={1}>
          <text fg={colors.command}>↑/↓</text>
          <text fg={colors.textDim}>navigate</text>
          <text fg={colors.textMuted}>·</text>
          <text fg={colors.command}>enter</text>
          <text fg={colors.textDim}>switch</text>
          <text fg={colors.textMuted}>·</text>
          <text fg={colors.command}>esc</text>
          <text fg={colors.textDim}>close</text>
        </box>
        {options.length === 0 ? (
          <text fg={colors.textDim}>No saved queries.</text>
        ) : (
          <select
            width={60}
            height={9}
            options={options}
            wrapSelection
            focused
            onSelect={handleSelect}
          />
        )}
      </box>
    </box>
  );
}

function firstLine(text: string): string {
  const line = text.split(/\r?\n/, 1)[0] ?? "";
  return line.length > 60 ? `${line.slice(0, 57)}...` : line;
}
