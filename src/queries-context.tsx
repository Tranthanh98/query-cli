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
import {
  loadQueries,
  newQueryId,
  saveQueries,
  type SavedQuery,
} from "./config/queries"

export type InputPrompt = {
  title: string
  placeholder?: string
  initialValue?: string
  onConfirm: (value: string) => void | Promise<void>
}

export interface QueriesContextValue {
  queries: SavedQuery[]
  activeId: string | null
  activeQuery: SavedQuery | null

  /** Create a new query from `text` under `name`, then make it active. */
  saveAs: (name: string, text: string) => SavedQuery
  /** Rename the active query. No-op if none. */
  renameActive: (name: string) => void
  /** Delete the active query and fall back to the first remaining (or none). */
  deleteActive: () => SavedQuery | null
  /** Switch active to `id`. Caller passes the latest editor text so we can
   *  snapshot the previously-active query before switching. */
  switchTo: (id: string, currentText: string) => SavedQuery | null
  /** Snapshot the active query's text from the editor without changing
   *  which query is active. Useful before destructive ops. */
  snapshotActive: (currentText: string) => void
  /** Clear the active selection (the editor becomes a scratch buffer). */
  clearActive: (currentText: string) => void

  inputPrompt: InputPrompt | null
  openInputPrompt: (prompt: InputPrompt) => void
  closeInputPrompt: () => void

  switchModalOpen: boolean
  openSwitchModal: () => void
  closeSwitchModal: () => void
}

const QueriesContext = createContext<QueriesContextValue | null>(null)

export function useQueries(): QueriesContextValue {
  const ctx = useContext(QueriesContext)
  if (!ctx) throw new Error("useQueries must be used within QueriesProvider")
  return ctx
}

export function QueriesProvider({
  children,
  connectionId,
}: {
  children: ReactNode
  connectionId: string
}) {
  const [allQueries, setAllQueries] = useState<SavedQuery[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [inputPrompt, setInputPrompt] = useState<InputPrompt | null>(null)
  const [switchModalOpen, setSwitchModalOpen] = useState(false)

  // Load persisted queries on mount.
  useEffect(() => {
    let cancelled = false
    loadQueries()
      .then((qs) => {
        if (cancelled) return
        setAllQueries(qs)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  // Mirror in refs so callbacks stay stable while reading the latest state.
  const allQueriesRef = useRef<SavedQuery[]>([])
  allQueriesRef.current = allQueries
  const activeIdRef = useRef<string | null>(null)
  activeIdRef.current = activeId
  const connectionIdRef = useRef(connectionId)
  connectionIdRef.current = connectionId

  // Fire-and-forget persistence. Errors are intentionally swallowed — failing
  // to persist shouldn't break the in-memory UX, and the next save retries.
  const persist = useCallback((next: SavedQuery[]) => {
    void saveQueries(next).catch(() => {})
  }, [])

  const saveAs = useCallback(
    (name: string, text: string) => {
      const entry: SavedQuery = {
        id: newQueryId(),
        name,
        text,
        connectionId: connectionIdRef.current,
      }
      const next = [...allQueriesRef.current, entry]
      setAllQueries(next)
      setActiveId(entry.id)
      persist(next)
      return entry
    },
    [persist],
  )

  const renameActive = useCallback(
    (name: string) => {
      const id = activeIdRef.current
      if (!id) return
      const next = allQueriesRef.current.map((q) =>
        q.id === id ? { ...q, name } : q,
      )
      setAllQueries(next)
      persist(next)
    },
    [persist],
  )

  const deleteActive = useCallback(() => {
    const id = activeIdRef.current
    if (!id) return null
    const next = allQueriesRef.current.filter((q) => q.id !== id)
    setAllQueries(next)
    const cid = connectionIdRef.current
    const fallback =
      next.find((q) => q.connectionId === cid || q.connectionId == null) ?? null
    setActiveId(fallback?.id ?? null)
    persist(next)
    return fallback
  }, [persist])

  const snapshotActive = useCallback(
    (currentText: string) => {
      const id = activeIdRef.current
      if (!id) return
      const next = allQueriesRef.current.map((q) =>
        q.id === id ? { ...q, text: currentText } : q,
      )
      setAllQueries(next)
      persist(next)
    },
    [persist],
  )

  const switchTo = useCallback(
    (id: string, currentText: string) => {
      const prevId = activeIdRef.current
      let next = allQueriesRef.current
      if (prevId && prevId !== id) {
        next = next.map((q) => (q.id === prevId ? { ...q, text: currentText } : q))
      }
      const target = next.find((q) => q.id === id) ?? null
      setAllQueries(next)
      setActiveId(target?.id ?? null)
      persist(next)
      return target
    },
    [persist],
  )

  const clearActive = useCallback(
    (currentText: string) => {
      const prevId = activeIdRef.current
      if (prevId) {
        const next = allQueriesRef.current.map((q) =>
          q.id === prevId ? { ...q, text: currentText } : q,
        )
        setAllQueries(next)
        persist(next)
      }
      setActiveId(null)
    },
    [persist],
  )

  const openInputPrompt = useCallback((prompt: InputPrompt) => setInputPrompt(prompt), [])
  const closeInputPrompt = useCallback(() => setInputPrompt(null), [])
  const openSwitchModal = useCallback(() => setSwitchModalOpen(true), [])
  const closeSwitchModal = useCallback(() => setSwitchModalOpen(false), [])

  // Queries visible to the UI: those tagged with the current connection, plus
  // legacy untagged queries (saved before per-connection scoping landed) so
  // pre-existing data stays reachable instead of silently vanishing.
  const queries = useMemo(
    () =>
      allQueries.filter(
        (q) => q.connectionId === connectionId || q.connectionId == null,
      ),
    [allQueries, connectionId],
  )

  const activeQuery = useMemo(
    () => queries.find((q) => q.id === activeId) ?? null,
    [queries, activeId],
  )

  const value = useMemo<QueriesContextValue>(
    () => ({
      queries,
      activeId,
      activeQuery,
      saveAs,
      renameActive,
      deleteActive,
      switchTo,
      snapshotActive,
      clearActive,
      inputPrompt,
      openInputPrompt,
      closeInputPrompt,
      switchModalOpen,
      openSwitchModal,
      closeSwitchModal,
    }),
    [
      queries,
      activeId,
      activeQuery,
      saveAs,
      renameActive,
      deleteActive,
      switchTo,
      snapshotActive,
      clearActive,
      inputPrompt,
      openInputPrompt,
      closeInputPrompt,
      switchModalOpen,
      openSwitchModal,
      closeSwitchModal,
    ],
  )

  return <QueriesContext.Provider value={value}>{children}</QueriesContext.Provider>
}
