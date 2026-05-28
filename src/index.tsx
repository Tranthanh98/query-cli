#!/usr/bin/env bun
import { createCliRenderer } from "@opentui/core"
import { createRoot } from "@opentui/react"
import { App } from "./app"

const renderer = await createCliRenderer({
  exitOnCtrlC: true,
  targetFps: 30,
  // Kitty keyboard protocol disambiguates modifier combos (ctrl+enter vs enter,
  // alt+key) on terminals that support it; ignored where unsupported. Note this
  // does NOT override a terminal's own shortcuts — e.g. Windows Terminal/conhost
  // still capture alt+enter for fullscreen before it reaches the app.
  useKittyKeyboard: {},
})

createRoot(renderer).render(<App />)
