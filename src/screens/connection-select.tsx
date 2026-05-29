import { useTerminalDimensions } from "@opentui/react";
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

export function ConnectionSelectScreen() {
  const { openDriverSelect, goMain, driverSelectOpen } = useApp();
  const [connections, setConnections] = useState<ConnectionConfig[]>([]);
  const [status, setStatus] = useState<{ text: string; color: string }>({
    text: "",
    color: colors.textDim,
  });
  const [loaded, setLoaded] = useState(false);
  const { height } = useTerminalDimensions();

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

  const handleSelect = async (_idx: number, opt: SelectOption | null) => {
    if (!opt) return;
    const choice = opt.value as Choice;
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

  const selectHeight = Math.min(
    Math.max(8, options.length + 2),
    Math.max(8, height - 12),
  );

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
          <select
            width={70}
            height={selectHeight}
            options={options}
            wrapSelection
            focused={!driverSelectOpen}
            selectedBackgroundColor={colors.selectedBg}
            selectedTextColor={colors.selectedFg}
            onSelect={handleSelect}
          />
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
