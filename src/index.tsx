#!/usr/bin/env bun
import { createCliRenderer } from "@opentui/core"
import { createRoot } from "@opentui/react"
import { App } from "./app"
import pkg from "../package.json" with { type: "json" }
import { checkForUpdate, performUpdate } from "./updater"

const args = process.argv.slice(2)

if (args.includes("--version") || args.includes("-v")) {
  console.log(pkg.version)
  process.exit(0)
}

if (args.includes("--update") || args[0] === "update") {
  console.log("Checking for updates...")
  try {
    const info = await checkForUpdate()
    if (!info) {
      console.log("You are already on the latest version.")
      process.exit(0)
    }
    console.log(`Update available: v${info.latestVersion} (current: v${info.currentVersion})`)
    console.log("Downloading and installing...")
    await performUpdate(info)
    // performUpdate exits the process on success
  } catch (err) {
    console.error(`Update failed: ${(err as Error).message}`)
    process.exit(1)
  }
}

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
