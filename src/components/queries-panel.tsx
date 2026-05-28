import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useApp } from "../app-context";
import { loadSearchState, saveSearchState } from "../config/search-state";
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
  const { connection } = useApp();

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
          connectionId={connection?.id ?? ""}
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
  connectionId,
  state,
  visibleCount,
  onLoadMore,
}: {
  connectionId: string;
  state: TablesState;
  visibleCount: number;
  onLoadMore: () => void;
}) {
  const { columnsCache, ensureColumns } = useSchema();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [tableQuery, setTableQuery] = useState("");
  const [schemaQuery, setSchemaQuery] = useState("");
  const [schemaExpanded, setSchemaExpanded] = useState(false);
  const loadedRef = useRef(false);

  // Load persisted search state when connection changes.
  useEffect(() => {
    loadedRef.current = false;
    setTableQuery("");
    setSchemaQuery("");
    setSchemaExpanded(false);
    if (!connectionId) return;
    loadSearchState()
      .then((stateMap) => {
        const saved = stateMap[connectionId];
        if (saved) {
          setTableQuery(saved.tableQuery ?? "");
          setSchemaQuery(saved.schemaQuery ?? "");
          setSchemaExpanded(saved.schemaExpanded ?? false);
        }
        loadedRef.current = true;
      })
      .catch(() => {
        loadedRef.current = true;
      });
  }, [connectionId]);

  // Persist search state when it changes.
  useEffect(() => {
    if (!connectionId || !loadedRef.current) return;
    const timeout = setTimeout(() => {
      void loadSearchState().then((stateMap) => {
        stateMap[connectionId] = { tableQuery, schemaQuery, schemaExpanded };
        void saveSearchState(stateMap);
      });
    }, 300);
    return () => clearTimeout(timeout);
  }, [connectionId, tableQuery, schemaQuery, schemaExpanded]);

  const handleToggle = (name: string) => {
    setExpanded((prev) => ({ ...prev, [name]: !prev[name] }));
    ensureColumns(name);
  };

  const clearSearch = useCallback(() => {
    setTableQuery("");
    setSchemaQuery("");
  }, []);

  const tables = state.kind === "loaded" ? state.tables : [];

  const filteredTables = useMemo(() => {
    return tables.filter((name) => {
      const parts = name.split(".");
      const schema = parts.length > 1 ? parts[0] : "";
      const tableName = parts.length > 1 ? parts.slice(1).join(".") : name;
      if (schemaQuery && !schema.toLowerCase().includes(schemaQuery.toLowerCase())) {
        return false;
      }
      if (tableQuery && !tableName.toLowerCase().includes(tableQuery.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [tables, tableQuery, schemaQuery]);

  if (state.kind === "idle") {
    return <text fg={colors.textDim}>Not connected.</text>;
  }
  if (state.kind === "loading") {
    return <text fg={colors.warning}>Loading tables...</text>;
  }
  if (state.kind === "error") {
    return <text fg={colors.error}>Error: {state.message}</text>;
  }

  if (tables.length === 0) {
    return <text fg={colors.textDim}>No tables in this database.</text>;
  }

  const shown = filteredTables.slice(0, visibleCount);
  const remaining = filteredTables.length - shown.length;

  return (
    <box flexDirection="column" flexGrow={1} flexShrink={1} gap={1}>
      <box flexDirection="column" flexShrink={0} gap={1}>
        <box flexDirection="row" gap={1} alignItems="center" height={1}>
          <box onMouseDown={() => setSchemaExpanded((v) => !v)}>
            <text fg={colors.panelQueries}>{schemaExpanded ? "▾" : "▸"}</text>
          </box>
          <input
            flexGrow={1}
            placeholder="Search table name..."
            placeholderColor={colors.textMuted}
            value={tableQuery}
            onInput={setTableQuery}
          />
        </box>
        {schemaExpanded && (
          <input
            flexGrow={1}
            placeholder="Search schema... (e.g. dbo, pgboss)"
            placeholderColor={colors.textMuted}
            value={schemaQuery}
            onInput={setSchemaQuery}
          />
        )}
        {(tableQuery || schemaQuery) && (
          <box
            paddingLeft={1}
            paddingRight={1}
            backgroundColor={colors.selectedBg}
            onMouseDown={clearSearch}
            flexShrink={0}
          >
            <text fg={colors.selectedFg}>Clear search</text>
          </box>
        )}
      </box>
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
          {shown.length} of {filteredTables.length}
          {filteredTables.length !== tables.length ? ` (filtered from ${tables.length})` : ""}
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
