import { useState } from "react";
import { useApp } from "../app-context";
import { colors } from "../theme";

export function HeaderBar({ onRun }: { onRun?: () => void }) {
  const { connection } = useApp();
  if (!connection) return null;
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
        <text fg={colors.textMuted}>·</text>
        <text fg={colors.command}>(F9/Ctrl+P)</text>
        <text fg={colors.textDim}>commands</text>
        <text fg={colors.textMuted}>·</text>
        <text fg={colors.command}>ctrl+c</text>
        <text fg={colors.textDim}>quit</text>
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
