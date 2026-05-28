import { useState } from "react";
import { useQueries } from "../queries-context";
import { useSchema, type ColumnsState, type TablesState } from "../schema-context";
import { colors } from "../theme";

type Tab = "database" | "queries";

const PAGE_SIZE = 20;

interface QueriesPanelProps {
  width: number;
  /** Switches the active query and pushes its text into the editor. */
  onSelectQuery: (id: string) => void;
}

export function QueriesPanel({ width, onSelectQuery }: QueriesPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>("database");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const { tablesState } = useSchema();

  return (
    <box
      borderStyle="rounded"
      borderColor={colors.panelQueries}
      title=" Explorer "
      titleAlignment="left"
      padding={1}
      flexDirection="column"
      width={width}
      flexShrink={0}
      gap={1}
    >
      <box flexDirection="row" height={1} flexShrink={0}>
        <TabHeader
          label="Database"
          active={activeTab === "database"}
          onClick={() => setActiveTab("database")}
        />
        <TabHeader
          label="Queries"
          active={activeTab === "queries"}
          onClick={() => setActiveTab("queries")}
        />
      </box>

      {activeTab === "database" ? (
        <DatabaseTab
          state={tablesState}
          visibleCount={visibleCount}
          onLoadMore={() => setVisibleCount((n) => n + PAGE_SIZE)}
        />
      ) : (
        <QueriesTab onSelectQuery={onSelectQuery} />
      )}
    </box>
  );
}

function TabHeader({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <box
      paddingLeft={1}
      paddingRight={1}
      marginRight={1}
      backgroundColor={active ? colors.selectedBg : undefined}
      onMouseDown={onClick}
    >
      <text fg={active ? colors.selectedFg : colors.textDim}>{label}</text>
    </box>
  );
}

function DatabaseTab({
  state,
  visibleCount,
  onLoadMore,
}: {
  state: TablesState;
  visibleCount: number;
  onLoadMore: () => void;
}) {
  const { columnsCache, ensureColumns } = useSchema();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const handleToggle = (name: string) => {
    setExpanded((prev) => ({ ...prev, [name]: !prev[name] }));
    ensureColumns(name);
  };

  if (state.kind === "idle") {
    return <text fg={colors.textDim}>Not connected.</text>;
  }
  if (state.kind === "loading") {
    return <text fg={colors.warning}>Loading tables...</text>;
  }
  if (state.kind === "error") {
    return <text fg={colors.error}>Error: {state.message}</text>;
  }

  const { tables } = state;
  if (tables.length === 0) {
    return <text fg={colors.textDim}>No tables in this database.</text>;
  }

  const shown = tables.slice(0, visibleCount);
  const remaining = tables.length - shown.length;

  return (
    <box flexDirection="column" flexGrow={1} flexShrink={1}>
      <scrollbox
        scrollY
        rootOptions={{ flexGrow: 1 }}
        contentOptions={{ flexDirection: "column", gap: 1 }}
      >
        {shown.map((name) => (
          <TableRow
            key={name}
            name={name}
            expanded={!!expanded[name]}
            columnsState={columnsCache[name]}
            onToggle={() => handleToggle(name)}
          />
        ))}
      </scrollbox>
      <box flexDirection="column" flexShrink={0} marginTop={0}>
        <text fg={colors.textMuted}>
          {shown.length} of {tables.length}
        </text>
        {remaining > 0 ? (
          <box
            paddingLeft={1}
            paddingRight={1}
            backgroundColor={colors.selectedBg}
            onMouseDown={onLoadMore}
          >
            <text fg={colors.selectedFg}>
              Load more ({Math.min(PAGE_SIZE, remaining)} of {remaining})
            </text>
          </box>
        ) : null}
      </box>
    </box>
  );
}

function TableRow({
  name,
  expanded,
  columnsState,
  onToggle,
}: {
  name: string;
  expanded: boolean;
  columnsState: ColumnsState | undefined;
  onToggle: () => void;
}) {
  return (
    <box flexDirection="column" flexShrink={0}>
      <box
        backgroundColor={colors.textMuted}
        paddingX={1}
        flexDirection="row"
        gap={1}
        flexShrink={0}
        height={1}
        onMouseDown={onToggle}
      >
        <text fg={colors.panelQueries}>{expanded ? "▾" : "▸"}</text>
        <text fg={colors.text}>{name}</text>
      </box>
      {expanded && columnsState ? <ColumnList state={columnsState} /> : null}
    </box>
  );
}

function ColumnList({ state }: { state: ColumnsState }) {
  if (state.kind === "loading") {
    return (
      <box paddingLeft={1}>
        <text fg={colors.textDim}>Loading columns...</text>
      </box>
    );
  }
  if (state.kind === "error") {
    return (
      <box paddingLeft={1}>
        <text fg={colors.error}>Error: {state.message}</text>
      </box>
    );
  }
  if (state.columns.length === 0) {
    return (
      <box paddingLeft={1}>
        <text fg={colors.textDim}>No columns.</text>
      </box>
    );
  }
  return (
    <box flexDirection="column" paddingLeft={1}>
      {state.columns.map((col) => (
        <box key={col.name} flexDirection="row" gap={1} height={1} flexShrink={0}>
          <text fg={colors.textDim}>·</text>
          <text fg={colors.text}>{col.name}</text>
          <text fg={colors.textMuted}>{col.type}</text>
        </box>
      ))}
    </box>
  );
}

function QueriesTab({ onSelectQuery }: { onSelectQuery: (id: string) => void }) {
  const { queries, activeId } = useQueries();

  if (queries.length === 0) {
    return (
      <box flexDirection="column">
        <text fg={colors.textDim}>No saved queries yet.</text>
        <text fg={colors.textMuted}>Type /save-query to save the current query.</text>
      </box>
    );
  }

  return (
    <scrollbox
      scrollY
      rootOptions={{ flexGrow: 1 }}
      contentOptions={{ flexDirection: "column" }}
    >
      {queries.map((q) => {
        const isActive = q.id === activeId;
        return (
          <box
            key={q.id}
            paddingX={1}
            height={1}
            flexShrink={0}
            backgroundColor={isActive ? colors.selectedBg : undefined}
            onMouseDown={() => onSelectQuery(q.id)}
          >
            <text fg={isActive ? colors.selectedFg : colors.text}>
              {isActive ? "▸ " : "  "}
              {q.name}
            </text>
          </box>
        );
      })}
    </scrollbox>
  );
}
