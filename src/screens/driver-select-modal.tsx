import type { SelectOption } from "@opentui/core";
import { useKeyboard } from "@opentui/react";
import { useApp } from "../app-context";
import { AVAILABLE_DRIVERS } from "../drivers";
import type { DriverKind } from "../drivers/types";
import { colors } from "../theme";

const DRIVER_LABELS: Record<DriverKind, { name: string; description: string }> =
  {
    postgres: {
      name: "PostgreSQL",
      description: "postgres · host / port / user / password",
    },
    mysql: {
      name: "MySQL",
      description: "mysql · host / port / user / password",
    },
    sqlite: { name: "SQLite", description: "sqlite · local database file" },
  };

export function DriverSelectModal() {
  const { driverSelectOpen, closeDriverSelect, goForm } = useApp();

  useKeyboard((key) => {
    if (!driverSelectOpen) return;
    if (key.name === "escape") closeDriverSelect();
  });

  if (!driverSelectOpen) return null;

  const options: SelectOption[] = AVAILABLE_DRIVERS.map((kind) => ({
    name: DRIVER_LABELS[kind].name,
    description: DRIVER_LABELS[kind].description,
    value: kind,
  }));

  const handleSelect = (_idx: number, opt: SelectOption | null) => {
    if (!opt) return;
    const kind = opt.value as DriverKind;
    goForm(kind);
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
        borderColor={colors.panelQuery}
        padding={1}
        title=" Select driver "
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
          <text fg={colors.textDim}>select</text>
          <text fg={colors.textMuted}>·</text>
          <text fg={colors.command}>esc</text>
          <text fg={colors.textDim}>cancel</text>
        </box>
        <select
          width={60}
          height={Math.max(8, options.length + 2)}
          options={options}
          wrapSelection
          focused
          onSelect={handleSelect}
        />
      </box>
    </box>
  );
}
