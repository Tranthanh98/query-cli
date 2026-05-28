import { createContext, useCallback, useContext, useMemo, useState } from "react"
import type { ReactNode } from "react"
import type { ConnectionConfig, DatabaseDriver, DriverKind } from "./drivers/types"
import type { SlashCommand } from "./commands"

export type Screen = "select" | "form" | "main"

export interface ConfirmRequest {
  title?: string
  message: string
  onConfirm: () => void | Promise<void>
}

export interface AppContextValue {
  screen: Screen
  connection: ConnectionConfig | null
  driver: DatabaseDriver | null

  formDriverKind: DriverKind | null

  goSelect: () => Promise<void>
  goForm: (driverKind: DriverKind) => void
  goMain: (driver: DatabaseDriver, connection: ConnectionConfig) => void

  driverSelectOpen: boolean
  openDriverSelect: () => void
  closeDriverSelect: () => void

  commands: SlashCommand[]
  setCommands: (cmds: SlashCommand[]) => void

  paletteOpen: boolean
  openPalette: () => void
  closePalette: () => void

  confirmRequest: ConfirmRequest | null
  requestConfirm: (req: ConfirmRequest) => void
  closeConfirm: () => void

  /**
   * Execute a slash command by name. Honors `confirm` and opens a
   * confirmation modal before running the handler.
   */
  runSlashCommand: (name: string) => Promise<void>
}

const AppContext = createContext<AppContextValue | null>(null)

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error("useApp must be used within AppProvider")
  return ctx
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [screen, setScreen] = useState<Screen>("select")
  const [connection, setConnection] = useState<ConnectionConfig | null>(null)
  const [driver, setDriver] = useState<DatabaseDriver | null>(null)
  const [commands, setCommands] = useState<SlashCommand[]>([])
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [confirmRequest, setConfirmRequest] = useState<ConfirmRequest | null>(null)
  const [driverSelectOpen, setDriverSelectOpen] = useState(false)
  const [formDriverKind, setFormDriverKind] = useState<DriverKind | null>(null)

  const goSelect = useCallback(async () => {
    if (driver) {
      await driver.disconnect().catch(() => {})
    }
    setDriver(null)
    setConnection(null)
    setCommands([])
    setPaletteOpen(false)
    setConfirmRequest(null)
    setDriverSelectOpen(false)
    setFormDriverKind(null)
    setScreen("select")
  }, [driver])

  const goForm = useCallback((driverKind: DriverKind) => {
    setFormDriverKind(driverKind)
    setDriverSelectOpen(false)
    setPaletteOpen(false)
    setScreen("form")
  }, [])

  const openDriverSelect = useCallback(() => setDriverSelectOpen(true), [])
  const closeDriverSelect = useCallback(() => setDriverSelectOpen(false), [])

  const goMain = useCallback((d: DatabaseDriver, c: ConnectionConfig) => {
    setDriver(d)
    setConnection(c)
    setPaletteOpen(false)
    setScreen("main")
  }, [])

  const openPalette = useCallback(() => setPaletteOpen(true), [])
  const closePalette = useCallback(() => setPaletteOpen(false), [])
  const requestConfirm = useCallback((req: ConfirmRequest) => setConfirmRequest(req), [])
  const closeConfirm = useCallback(() => setConfirmRequest(null), [])

  const runSlashCommand = useCallback(
    async (name: string) => {
      const cmd = commands.find((c) => c.name === name)
      if (!cmd) return
      if (cmd.confirm) {
        setConfirmRequest({
          title: cmd.confirm.title ?? cmd.name,
          message: cmd.confirm.message,
          onConfirm: () => cmd.handler(),
        })
        return
      }
      await cmd.handler()
    },
    [commands],
  )

  const value = useMemo<AppContextValue>(
    () => ({
      screen,
      connection,
      driver,
      formDriverKind,
      goSelect,
      goForm,
      goMain,
      driverSelectOpen,
      openDriverSelect,
      closeDriverSelect,
      commands,
      setCommands,
      paletteOpen,
      openPalette,
      closePalette,
      confirmRequest,
      requestConfirm,
      closeConfirm,
      runSlashCommand,
    }),
    [
      screen,
      connection,
      driver,
      formDriverKind,
      goSelect,
      goForm,
      goMain,
      driverSelectOpen,
      openDriverSelect,
      closeDriverSelect,
      commands,
      paletteOpen,
      openPalette,
      closePalette,
      confirmRequest,
      requestConfirm,
      closeConfirm,
      runSlashCommand,
    ],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
