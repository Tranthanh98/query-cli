import { useEffect } from "react"
import { AppProvider, useApp } from "./app-context"
import { SuggestionPopupProvider } from "./components/suggestion-popup"
import { CommandPalette } from "./screens/command-palette"
import { ConfirmModal } from "./screens/confirm-modal"
import { ConnectionFormScreen } from "./screens/connection-form"
import { ConnectionSelectScreen } from "./screens/connection-select"
import { DriverSelectModal } from "./screens/driver-select-modal"
import { MainScreen } from "./screens/main"
import { ToastProvider, useToast } from "./toast-context"
import { checkForUpdate, performUpdate } from "./updater"

function UpdateChecker() {
  const { requestConfirm } = useApp()
  const { showToast } = useToast()

  useEffect(() => {
    let cancelled = false
    const timer = setTimeout(() => {
      checkForUpdate().then((info) => {
        if (cancelled || !info) return
        requestConfirm({
          title: `Update available: v${info.latestVersion}`,
          message: `You are on v${info.currentVersion}. Download and install now?`,
          onConfirm: async () => {
            showToast("Downloading update...", { kind: "info" })
            try {
              await performUpdate(info)
            } catch (err) {
              showToast(`Update failed: ${(err as Error).message}`, { kind: "error" })
            }
          },
        })
      })
    }, 800)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [requestConfirm, showToast])

  return null
}

function Router() {
  const { screen, paletteOpen, confirmRequest, driverSelectOpen } = useApp()
  return (
    <box flexDirection="column" width="100%" height="100%">
      {screen === "select" && <ConnectionSelectScreen />}
      {screen === "form" && <ConnectionFormScreen />}
      {screen === "main" && <MainScreen />}
      {driverSelectOpen && <DriverSelectModal />}
      {paletteOpen && !confirmRequest && <CommandPalette />}
      {confirmRequest && <ConfirmModal />}
    </box>
  )
}

export function App() {
  return (
    <AppProvider>
      <ToastProvider>
        <SuggestionPopupProvider>
          <UpdateChecker />
          <Router />
        </SuggestionPopupProvider>
      </ToastProvider>
    </AppProvider>
  )
}
