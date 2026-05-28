import { useKeyboard, useTerminalDimensions } from "@opentui/react";
import { useMemo, useState } from "react";
import { useApp } from "../app-context";
import { colors } from "../theme";

// Border + padding + input + hint row + gaps take up ~9 lines; cap the list
// at whatever's left so the palette never overflows the terminal.
const PALETTE_CHROME_ROWS = 9;
const PALETTE_MIN_ROWS = 3;
const PALETTE_WIDTH = 60;

export function CommandPalette() {
  const { commands, closePalette, runSlashCommand } = useApp();
  const { height } = useTerminalDimensions();
  const maxRows = Math.max(PALETTE_MIN_ROWS, height - PALETTE_CHROME_ROWS);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q),
    );
  }, [commands, query]);

  // Clamp the selected index whenever the filtered list shrinks.
  const safeIndex = filtered.length === 0 ? 0 : Math.min(selectedIndex, filtered.length - 1);

  const handleQueryChange = (v: string) => {
    setQuery(v);
    setSelectedIndex(0);
  };

  const runSelected = async () => {
    const target = filtered[safeIndex];
    if (!target) return;
    closePalette();
    await runSlashCommand(target.name);
  };

  useKeyboard((key) => {
    if (key.name === "escape") {
      closePalette();
      return;
    }
    if (filtered.length === 0) return;
    if (key.name === "up") {
      setSelectedIndex((i) => {
        const cur = Math.min(i, filtered.length - 1);
        return (cur - 1 + filtered.length) % filtered.length;
      });
    } else if (key.name === "down") {
      setSelectedIndex((i) => {
        const cur = Math.min(i, filtered.length - 1);
        return (cur + 1) % filtered.length;
      });
    }
  });

  // Window the visible slice so the selection stays in view when the list is
  // taller than the terminal allows.
  const windowStart = Math.max(
    0,
    Math.min(
      safeIndex - Math.floor(maxRows / 2),
      Math.max(0, filtered.length - maxRows),
    ),
  );
  const visible = filtered.slice(windowStart, windowStart + maxRows);

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
        borderColor={colors.command}
        padding={1}
        title=" Commands "
        titleAlignment="left"
        flexDirection="column"
        gap={1}
        backgroundColor={colors.surfaceAlt}
      >
        <input
          width={PALETTE_WIDTH}
          placeholder="Search by name or description..."
          placeholderColor={colors.textMuted}
          value={query}
          focused
          onInput={handleQueryChange}
          onSubmit={() => {
            void runSelected();
          }}
        />
        <box flexDirection="row" gap={1}>
          <text fg={colors.command}>↑/↓</text>
          <text fg={colors.textDim}>navigate</text>
          <text fg={colors.textMuted}>·</text>
          <text fg={colors.command}>enter</text>
          <text fg={colors.textDim}>run</text>
          <text fg={colors.textMuted}>·</text>
          <text fg={colors.command}>esc</text>
          <text fg={colors.textDim}>close</text>
        </box>
        {filtered.length === 0 ? (
          <text fg={colors.textDim}>
            {commands.length === 0 ? "No commands available." : "No matches."}
          </text>
        ) : (
          <box flexDirection="column" width={PALETTE_WIDTH}>
            {visible.map((cmd, i) => {
              const absoluteIndex = windowStart + i;
              const isSelected = absoluteIndex === safeIndex;
              return (
                <box
                  key={cmd.name}
                  border={["left"]}
                  borderStyle="heavy"
                  borderColor={isSelected ? colors.command : "transparent"}
                  paddingX={1}
                  flexDirection="column"
                  backgroundColor={isSelected ? colors.selectedBg : undefined}
                  onMouseDown={() => {
                    setSelectedIndex(absoluteIndex);
                    void runSelected();
                  }}
                >
                  <text fg={isSelected ? colors.selectedFg : colors.text}>
                    {cmd.description}
                  </text>
                  <text fg={colors.textDim}>{cmd.name}</text>
                </box>
              );
            })}
          </box>
        )}
      </box>
    </box>
  );
}
