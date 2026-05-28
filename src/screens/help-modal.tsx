import { useKeyboard } from "@opentui/react";
import { colors } from "../theme";

interface Shortcut {
  keys: string;
  description: string;
}

// Keyboard shortcuts shown in the help popup. Keep in sync with the global key
// handler in main.tsx and the header-bar hints.
const SHORTCUTS: Shortcut[] = [
  { keys: "F5 / Ctrl+R", description: "Run query" },
  { keys: "F9 / Ctrl+P", description: "Command palette" },
  { keys: "Ctrl+Y", description: "Copy selection" },
  { keys: "Ctrl+H / F1", description: "This help" },
  { keys: "Ctrl+C", description: "Quit" },
];

const AI_HINTS: Shortcut[] = [
  { keys: "@ai: …", description: "Ask AI in the editor (Enter to run)" },
  { keys: "/ask-ai", description: "Insert @ai: at the cursor" },
  { keys: "/ai-config", description: "Configure AI adapter and model" },
];

const KEY_COLUMN_WIDTH = 16;

export function HelpModal({ onClose }: { onClose: () => void }) {
  useKeyboard((key) => {
    if (key.name === "escape" || key.name === "f1" || (key.ctrl && key.name === "h")) {
      onClose();
    }
  });

  return (
    <box
      position="absolute"
      left={0}
      top={0}
      right={0}
      bottom={0}
      justifyContent="center"
      alignItems="center"
      onMouseDown={() => onClose()}
    >
      <box
        borderStyle="rounded"
        borderColor={colors.command}
        padding={1}
        title=" Keyboard shortcuts "
        titleAlignment="left"
        flexDirection="column"
        gap={1}
        backgroundColor={colors.surfaceAlt}
        // Clicks inside the dialog must not reach the backdrop's close handler.
        onMouseDown={(e) => e.stopPropagation()}
      >
        <box flexDirection="column">
          {SHORTCUTS.map((s) => (
            <box key={s.keys} flexDirection="row">
              <box width={KEY_COLUMN_WIDTH}>
                <text fg={colors.command}>{s.keys}</text>
              </box>
              <text fg={colors.text}>{s.description}</text>
            </box>
          ))}
        </box>
        <box flexDirection="column">
          <text fg={colors.section}>Ask AI</text>
          {AI_HINTS.map((s) => (
            <box key={s.keys} flexDirection="row">
              <box width={KEY_COLUMN_WIDTH}>
                <text fg={colors.command}>{s.keys}</text>
              </box>
              <text fg={colors.text}>{s.description}</text>
            </box>
          ))}
        </box>
        <text fg={colors.textDim}>
          Type / in the editor for commands · esc to close
        </text>
      </box>
    </box>
  );
}
