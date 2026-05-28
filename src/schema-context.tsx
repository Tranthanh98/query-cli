import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import type { ReactNode } from "react"
import type { ColumnInfo, DatabaseDriver, DriverKind } from "./drivers/types"

export type TablesState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "loaded"; tables: string[] }
  | { kind: "error"; message: string }

export type ColumnsState =
  | { kind: "loading" }
  | { kind: "loaded"; columns: ColumnInfo[] }
  | { kind: "error"; message: string }

export interface SchemaContextValue {
  tablesState: TablesState
  columnsCache: Record<string, ColumnsState>
  driverKind: DriverKind | null
  /**
   * Trigger a one-time fetch of the table's columns. Subsequent calls for the
   * same table are no-ops — readers should look up `columnsCache[table]` for
   * the current state.
   */
  ensureColumns: (table: string) => void
}

const SchemaContext = createContext<SchemaContextValue | null>(null)

export function useSchema(): SchemaContextValue {
  const ctx = useContext(SchemaContext)
  if (!ctx) throw new Error("useSchema must be used within SchemaProvider")
  return ctx
}

export function SchemaProvider({
  driver,
  children,
}: {
  driver: DatabaseDriver | null
  children: ReactNode
}) {
  const [tablesState, setTablesState] = useState<TablesState>({ kind: "idle" })
  const [columnsCache, setColumnsCache] = useState<Record<string, ColumnsState>>({})

  // Mirror the cache in a ref so ensureColumns can dedupe in-flight requests
  // without depending on the latest state snapshot (which would re-create the
  // callback on every column fetch and re-render consumers).
  const cacheRef = useRef<Record<string, ColumnsState>>({})

  useEffect(() => {
    cacheRef.current = {}
    setColumnsCache({})
    if (!driver) {
      setTablesState({ kind: "idle" })
      return
    }
    let cancelled = false
    setTablesState({ kind: "loading" })
    driver
      .listTables()
      .then((tables) => {
        if (cancelled) return
        setTablesState({ kind: "loaded", tables })
      })
      .catch((e: unknown) => {
        if (cancelled) return
        const message = e instanceof Error ? e.message : String(e)
        setTablesState({ kind: "error", message })
      })
    return () => {
      cancelled = true
    }
  }, [driver])

  const ensureColumns = useCallback(
    (table: string) => {
      if (!driver) return
      if (cacheRef.current[table]) return
      cacheRef.current[table] = { kind: "loading" }
      setColumnsCache({ ...cacheRef.current })
      driver
        .listColumns(table)
        .then((columns) => {
          cacheRef.current[table] = { kind: "loaded", columns }
          setColumnsCache({ ...cacheRef.current })
        })
        .catch((e: unknown) => {
          const message = e instanceof Error ? e.message : String(e)
          cacheRef.current[table] = { kind: "error", message }
          setColumnsCache({ ...cacheRef.current })
        })
    },
    [driver],
  )

  const driverKind = driver?.kind ?? null
  const value = useMemo<SchemaContextValue>(
    () => ({ tablesState, columnsCache, driverKind, ensureColumns }),
    [tablesState, columnsCache, driverKind, ensureColumns],
  )

  return <SchemaContext.Provider value={value}>{children}</SchemaContext.Provider>
}
