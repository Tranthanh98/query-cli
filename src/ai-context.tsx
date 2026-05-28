import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react"
import type { ReactNode } from "react"
import { useApp } from "./app-context"
import { useSchema } from "./schema-context"
import { envVarHint, loadAiConfig, resolveApiKey } from "./ai/config"
import { createAiAdapter } from "./ai/registry"
import { makeSchemaTools } from "./ai/tools"
import {
  AiConfigError,
  type AiAdapter,
  type AiStatus,
  type ToolContext,
} from "./ai/types"

export type AiState = "idle" | "running"

export interface AiContextValue {
  state: AiState
  cancel(): void
  requestSql(req: {
    prompt: string
    blockContext: string
    onStatus: (s: AiStatus) => void
  }): Promise<string>
}

const AiContext = createContext<AiContextValue | null>(null)

export function useAi(): AiContextValue {
  const ctx = useContext(AiContext)
  if (!ctx) throw new Error("useAi must be used within AiProvider")
  return ctx
}

export function AiProvider({ children }: { children: ReactNode }) {
  const { driver } = useApp()
  const { tablesState, columnsCache, ensureColumns } = useSchema()
  const [state, setState] = useState<AiState>("idle")
  const inFlightRef = useRef<AbortController | null>(null)
  const adapterCacheRef = useRef<{ kind: string; adapter: AiAdapter } | null>(null)

  const tablesStateRef = useRef(tablesState)
  tablesStateRef.current = tablesState
  const columnsCacheRef = useRef(columnsCache)
  columnsCacheRef.current = columnsCache
  const ensureColumnsRef = useRef(ensureColumns)
  ensureColumnsRef.current = ensureColumns

  const buildToolContext = useCallback((): ToolContext => {
    if (!driver) throw new Error("AI requested before driver connected")
    return {
      driver,
      tables: () => resolveTables(tablesStateRef.current, driver),
      columns: (table) =>
        resolveColumns(
          table,
          columnsCacheRef.current,
          ensureColumnsRef.current,
          driver,
        ),
    }
  }, [driver])

  const requestSql = useCallback<AiContextValue["requestSql"]>(
    async ({ prompt, blockContext, onStatus }) => {
      if (!driver) throw new Error("No active database connection")
      const config = await loadAiConfig()
      if (!config) {
        throw new AiConfigError(
          "AI is not configured. Run /ai-config to pick an adapter and model.",
        )
      }
      const apiKey = resolveApiKey(config)
      if (!apiKey) {
        throw new AiConfigError(
          `Missing API key for ${config.adapter}. Enter it via /ai-config or set ${envVarHint(config.adapter)} in your environment.`,
        )
      }

      let cached = adapterCacheRef.current
      if (!cached || cached.kind !== config.adapter) {
        cached = { kind: config.adapter, adapter: createAiAdapter(config.adapter) }
        adapterCacheRef.current = cached
      }

      const controller = new AbortController()
      inFlightRef.current?.abort()
      inFlightRef.current = controller
      setState("running")

      try {
        const tools = makeSchemaTools(buildToolContext())
        const sql = await cached.adapter.generateSql({
          prompt,
          blockContext,
          driverKind: driver.kind,
          tools,
          model: config.model,
          apiKey,
          onStatus,
          signal: controller.signal,
        })
        return sql
      } finally {
        if (inFlightRef.current === controller) {
          inFlightRef.current = null
        }
        setState("idle")
      }
    },
    [driver, buildToolContext],
  )

  const cancel = useCallback(() => {
    inFlightRef.current?.abort()
  }, [])

  const value = useMemo<AiContextValue>(
    () => ({ state, cancel, requestSql }),
    [state, cancel, requestSql],
  )

  return <AiContext.Provider value={value}>{children}</AiContext.Provider>
}

async function resolveTables(
  state: ReturnType<typeof useSchema>["tablesState"],
  driver: NonNullable<ReturnType<typeof useApp>["driver"]>,
): Promise<string[]> {
  if (state.kind === "loaded") return state.tables
  return driver.listTables()
}

async function resolveColumns(
  table: string,
  cache: ReturnType<typeof useSchema>["columnsCache"],
  ensure: ReturnType<typeof useSchema>["ensureColumns"],
  driver: NonNullable<ReturnType<typeof useApp>["driver"]>,
) {
  const entry = cache[table]
  if (entry?.kind === "loaded") return entry.columns
  ensure(table)
  return driver.listColumns(table)
}
