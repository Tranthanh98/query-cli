import { useKeyboard } from "@opentui/react";
import { colors } from "../theme";

interface Shortcut {
  key: string;
  mac: string;
  description: string;
}

// Keyboard shortcuts shown in the help popup. Keep in sync with the global key
// handler in main.tsx, the header-bar hints, and README.md.
const SHORTCUTS: Shortcut[] = [
  { key: "F5 / Ctrl+R", mac: "F5 / ⌃R", description: "Run query" },
  { key: "F9 / Ctrl+P", mac: "F9 / ⌃P", description: "Command palette" },
  { key: "Ctrl+Y", mac: "⌃Y", description: "Copy selection" },
  { key: "Ctrl+H / F1", mac: "⌃H / F1", description: "This help" },
  { key: "Ctrl+C", mac: "⌃C", description: "Quit" },
];

interface AiHint {
  keys: string;
  description: string;
}

const AI_HINTS: AiHint[] = [
  { keys: "@ai: …", description: "Ask AI in the editor (Enter to run)" },
  { keys: "/ask-ai", description: "Insert @ai: at the cursor" },
  { keys: "/ai-config", description: "Configure AI adapter and model" },
];

const KEY_COLUMN_WIDTH = 16;
const MAC_COLUMN_WIDTH = 14;

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
            <box key={s.key} flexDirection="row">
              <box width={KEY_COLUMN_WIDTH}>
                <text fg={colors.command}>{s.key}</text>
              </box>
              <box width={MAC_COLUMN_WIDTH}>
                <text fg={colors.command}>{s.mac}</text>
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
