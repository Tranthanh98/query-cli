import { useKeyboard, useTerminalDimensions } from "@opentui/react";
import type { SelectOption } from "@opentui/core";
import { useEffect, useState } from "react";
import { useApp } from "../app-context";
import { AsciiLogo } from "../components/ascii-logo";
import { loadConnections } from "../config/connections";
import { createDriver } from "../drivers";
import type { ConnectionConfig } from "../drivers/types";
import { colors } from "../theme";

type Choice =
  | { kind: "connect"; conn: ConnectionConfig }
  | { kind: "new" }
  | { kind: "quit" };

const ITEM_HEIGHT = 2;

export function ConnectionSelectScreen() {
  const { openDriverSelect, goMain, driverSelectOpen } = useApp();
  const [connections, setConnections] = useState<ConnectionConfig[]>([]);
  const [status, setStatus] = useState<{ text: string; color: string }>({
    text: "",
    color: colors.textDim,
  });
  const [loaded, setLoaded] = useState(false);
  const { height } = useTerminalDimensions();
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    loadConnections().then((conns) => {
      setConnections(conns);
      setLoaded(true);
    });
  }, []);

  const options: SelectOption[] = [
    ...connections.map((c) => ({
      name: c.name,
      description: describe(c),
      value: { kind: "connect" as const, conn: c },
    })),
    {
      name: "+ New connection",
      description: "Create a new database connection",
      value: { kind: "new" as const },
    },
    {
      name: "Quit",
      description: "Exit query-cli",
      value: { kind: "quit" as const },
    },
  ];

  const executeChoice = async (choice: Choice) => {
    if (choice.kind === "quit") {
      process.exit(0);
    } else if (choice.kind === "new") {
      openDriverSelect();
    } else {
      setStatus({
        text: `Connecting to ${choice.conn.name}...`,
        color: colors.warning,
      });
      try {
        const driver = createDriver(choice.conn.driver);
        await driver.connect(choice.conn);
        goMain(driver, choice.conn);
      } catch (e: any) {
        setStatus({
          text: `Connection failed: ${e?.message ?? e}`,
          color: colors.error,
        });
      }
    }
  };

  const handleSelect = (idx: number) => {
    const opt = options[idx];
    if (!opt) return;
    const choice = opt.value as Choice;
    void executeChoice(choice);
  };

  useKeyboard((key) => {
    if (driverSelectOpen) return;
    if (options.length === 0) return;

    if (key.name === "up") {
      setSelectedIndex((i) => (i - 1 + options.length) % options.length);
    } else if (key.name === "down") {
      setSelectedIndex((i) => (i + 1) % options.length);
    } else if (key.name === "return" || key.name === "enter") {
      handleSelect(selectedIndex);
    }
  });

  const selectHeight = Math.min(
    Math.max(8, options.length * ITEM_HEIGHT + 2),
    Math.max(8, height - 12),
  );

  const maxVisibleItems = Math.max(3, Math.floor(selectHeight / ITEM_HEIGHT));

  const windowStart = Math.max(
    0,
    Math.min(
      selectedIndex - Math.floor(maxVisibleItems / 2),
      Math.max(0, options.length - maxVisibleItems),
    ),
  );
  const visibleOptions = options.slice(windowStart, windowStart + maxVisibleItems);

  return (
    <box
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      width="100%"
      height="100%"
      padding={2}
    >
      <AsciiLogo />

      <box
        borderStyle="rounded"
        borderColor={colors.title}
        backgroundColor={colors.surface}
        padding={1}
        title=" query-cli "
        titleAlignment="left"
        flexDirection="column"
        gap={1}
        marginTop={1}
      >
        <text fg={colors.section}>Select a connection</text>
        <box flexDirection="row" gap={1}>
          <text fg={colors.command}>↑/↓</text>
          <text fg={colors.textDim}>navigate</text>
          <text fg={colors.textMuted}>·</text>
          <text fg={colors.command}>enter</text>
          <text fg={colors.textDim}>confirm</text>
          <text fg={colors.textMuted}>·</text>
          <text fg={colors.command}>ctrl+c</text>
          <text fg={colors.textDim}>quit</text>
        </box>
        {loaded ? (
          <box
            flexDirection="column"
            width={70}
            maxHeight={maxVisibleItems * ITEM_HEIGHT}
          >
            {visibleOptions.map((opt, i) => {
              const absoluteIndex = windowStart + i;
              const isSelected = absoluteIndex === selectedIndex;
              return (
                <box
                  key={opt.name + absoluteIndex}
                  height={ITEM_HEIGHT}
                  border={["left"]}
                  borderStyle="heavy"
                  borderColor={isSelected ? colors.command : "transparent"}
                  paddingX={1}
                  flexDirection="column"
                  backgroundColor={isSelected ? colors.selectedBg : undefined}
                  onMouseDown={() => {
                    setSelectedIndex(absoluteIndex);
                    handleSelect(absoluteIndex);
                  }}
                >
                  <text fg={isSelected ? colors.selectedFg : colors.text}>
                    {opt.name}
                  </text>
                  <text fg={colors.textDim}>{opt.description}</text>
                </box>
              );
            })}
          </box>
        ) : (
          <text fg={colors.textDim}>Loading connections...</text>
        )}
        {status.text ? <text fg={status.color}>{status.text}</text> : null}
      </box>
    </box>
  );
}

function describe(c: ConnectionConfig): string {
  if (c.driver === "sqlite") return `sqlite · ${c.database}`;
  const userPart = c.user ? `${c.user}@` : "";
  const hostPart = c.host ?? "localhost";
  const portPart = c.port ? `:${c.port}` : "";
  return `${c.driver}://${userPart}${hostPart}${portPart}/${c.database}`;
}
