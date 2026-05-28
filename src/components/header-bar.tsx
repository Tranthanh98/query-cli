import { useState } from "react";
import { useTerminalDimensions } from "@opentui/react";
import { useApp } from "../app-context";
import { colors } from "../theme";

export function HeaderBar({ onRun }: { onRun?: () => void }) {
  const { connection } = useApp();
  const { width } = useTerminalDimensions();
  if (!connection) return null;

  // Responsive: drop hints as the terminal narrows.
  const showSave = width >= 90;
  const showCmds = width >= 70;
  const showQuit = width >= 55;

  return (
    <box
      flexDirection="row"
      paddingX={1}
      justifyContent="space-between"
      borderStyle="single"
      borderColor={colors.border}
    >
      <box flexDirection="row" gap={1}>
        <text fg={colors.title}>query-cli</text>
        <text fg={colors.textMuted}>·</text>
        <text fg={colors.text}>{connection.name}</text>
        <text fg={colors.textDim}>({connection.driver})</text>
      </box>
      <box flexDirection="row" gap={1}>
        <RunButton onRun={onRun} />
        {showSave && (
          <>
            <text fg={colors.textMuted}>·</text>
            <text fg={colors.command}>Ctrl+S</text>
            <text fg={colors.textDim}>save</text>
          </>
        )}
        {showCmds && (
          <>
            <text fg={colors.textMuted}>·</text>
            <text fg={colors.command}>(F9/Ctrl+P)</text>
            <text fg={colors.textDim}>commands</text>
          </>
        )}
        {showQuit && (
          <>
            <text fg={colors.textMuted}>·</text>
            <text fg={colors.command}>ctrl+c</text>
            <text fg={colors.textDim}>quit</text>
          </>
        )}
      </box>
    </box>
  );
}

// Clickable run button. Fills with the command accent on hover for affordance,
// mirroring the onMouseDown click convention used elsewhere (tabs, query list).
function RunButton({ onRun }: { onRun?: () => void }) {
  const [hot, setHot] = useState(false);
  return (
    <box
      paddingX={1}
      backgroundColor={hot ? colors.command : colors.selectedBg}
      onMouseOver={() => setHot(true)}
      onMouseOut={() => setHot(false)}
      onMouseDown={() => onRun?.()}
    >
      <text fg={hot ? colors.surface : colors.command}>▶ Run (F5/Ctrl+R)</text>
    </box>
  );
}
