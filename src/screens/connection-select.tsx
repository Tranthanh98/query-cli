import { useKeyboard } from "@opentui/react";
import { useEffect, useState } from "react";
import { useApp } from "../app-context";
import { loadConnections } from "../config/connections";
import { createDriver } from "../drivers";
import type { ConnectionConfig } from "../drivers/types";
import { colors } from "../theme";

type Choice =
  | { kind: "connect"; conn: ConnectionConfig }
  | { kind: "new" }
  | { kind: "quit" };

interface OptionItem {
  name: string;
  description: string;
  value: Choice;
}

export function ConnectionSelectScreen() {
  const { openDriverSelect, goMain, driverSelectOpen } = useApp();
  const [connections, setConnections] = useState<ConnectionConfig[]>([]);
  const [status, setStatus] = useState<{ text: string; color: string }>({
    text: "",
    color: colors.textDim,
  });
  const [loaded, setLoaded] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    loadConnections().then((conns) => {
      setConnections(conns);
      setLoaded(true);
    });
  }, []);

  const options: OptionItem[] = [
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

  const handleSelect = async (choice: Choice) => {
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

  useKeyboard((key) => {
    if (driverSelectOpen) return;
    if (!loaded || options.length === 0) return;
    if (key.name === "up" || key.name === "k") {
      setSelectedIndex((i) => (i - 1 + options.length) % options.length);
    } else if (key.name === "down" || key.name === "j") {
      setSelectedIndex((i) => (i + 1) % options.length);
    } else if (key.name === "return") {
      const opt = options[Math.min(selectedIndex, options.length - 1)];
      if (opt) handleSelect(opt.value);
    }
  });

  return (
    <box
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      width="100%"
      height="100%"
      padding={2}
    >
      <box
        borderStyle="rounded"
        borderColor={colors.title}
        backgroundColor={colors.surface}
        padding={1}
        title=" query-cli "
        titleAlignment="left"
        flexDirection="column"
        gap={1}
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
        {loaded && (
          <box flexDirection="column" width={70}>
            {options.map((opt, i) => {
              const isSelected = i === selectedIndex;
              return (
                <box
                  key={`${opt.name}-${i}`}
                  border={["left"]}
                  borderStyle="heavy"
                  borderColor={isSelected ? colors.success : "transparent"}
                  paddingX={1}
                  flexDirection="column"
                  backgroundColor={isSelected ? colors.selectedBg : undefined}
                  onMouseDown={() => {
                    setSelectedIndex(i);
                    handleSelect(opt.value);
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
