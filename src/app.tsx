import { AppProvider, useApp } from "./app-context"
import { SuggestionPopupProvider } from "./components/suggestion-popup"
import { CommandPalette } from "./screens/command-palette"
import { ConfirmModal } from "./screens/confirm-modal"
import { ConnectionFormScreen } from "./screens/connection-form"
import { ConnectionSelectScreen } from "./screens/connection-select"
import { DriverSelectModal } from "./screens/driver-select-modal"
import { MainScreen } from "./screens/main"
import { ToastProvider } from "./toast-context"

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
          <Router />
        </SuggestionPopupProvider>
      </ToastProvider>
    </AppProvider>
  )
}
