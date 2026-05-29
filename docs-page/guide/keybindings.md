# Keybindings

query-cli is designed to be fully keyboard-driven. Every action has a shortcut.

<HelpModalDemo />

## Global Shortcuts

| Key (Linux / Windows) | macOS | Action |
|---|---|---|
| `F5` / `Ctrl + R` | `F5` / `Control + R` | Run query |
| `F9` / `Ctrl + P` | `F9` / `Control + P` | Open command palette |
| `Ctrl + S` | `Control + S` | Save query |
| `Ctrl + N` | `Control + N` | New query |
| `Ctrl + D` | `Control + D` | Delete query |
| `Ctrl + Y` | `Control + Y` | Copy selection to clipboard |
| `F1` / `Ctrl + H` | `F1` / `Control + H` | Show keyboard shortcuts help |
| `Ctrl + C` | `Control + C` | Quit |

> **Note:** `Ctrl+S` may freeze some Unix terminals (XOFF). Press `Ctrl+Q` to resume, or disable flow control with `stty -ixon`.

> Tab management (new, switch, save, rename, delete) and other actions are available through slash commands in the editor — type `/` to see the list.

## Editor Shortcuts

Inside the query editor:

- `↑/↓` — Navigate suggestions (when autocomplete is visible)
- `Tab` / `Enter` — Accept suggestion
- `Esc` — Dismiss suggestions

## Connection Screen

- `↑/↓` or `j/k` — Navigate connections
- `Enter` — Connect / Create new / Quit
- `Ctrl+C` — Quit

## AI Prompts

- `@ai: <your request>` — Ask AI to generate SQL
- `Enter` — Submit AI prompt
- `Esc` (while AI is thinking) — Cancel AI request

<script setup>
import HelpModalDemo from '../.vitepress/theme/components/HelpModalDemo.vue'
</script>
