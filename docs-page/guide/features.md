# Features

query-cli packs a powerful set of features into a lightweight terminal application. Here's an overview of everything it can do.

## Database Connections

Manage multiple database connections from a single interface. Support for **PostgreSQL**, **MySQL**, and **SQLite** with saved connection profiles.

<ConnectionSelectDemo />

<ConnectionFormDemo />

## Query Editor

A full-featured SQL editor inside your terminal with:

- **Syntax highlighting** for SQL keywords, table names, and columns
- **Tabbed queries** — work on multiple queries at once
- **Auto-save** and restore unsaved work
- **Slash commands** for quick actions
- **AI prompts** with `@ai:` blocks

<MainScreenDemo />

## Schema Explorer

Browse your database schema without leaving the terminal:

- Table list with pagination
- Expand tables to see columns and indexes
- Schema-aware SQL autocomplete

## AI Assistant

Get help writing SQL from leading AI providers:

- **Anthropic Claude**
- **OpenAI GPT**
- **OpenRouter**
- **Google Gemini**

Type `@ai:` followed by your request in the editor, press Enter, and watch AI generate SQL for you.

<AiConfigDemo />

## Command Palette

Access every feature through a searchable command palette (`F9` or `Ctrl+P`).

<CommandPaletteDemo />

## Keyboard Shortcuts

Everything is keyboard-driven. Press `F1` or `Ctrl+H` to see the full shortcut reference.

<HelpModalDemo />

## Slash Commands

Type `/` in the editor to access quick commands:

| Command | Description |
|---|---|
| `/run` | Execute the current query |
| `/commands` | Open the command palette |
| `/help` | Show keyboard shortcuts |
| `/ai-config` | Configure AI adapter |
| `/ask-ai` | Insert `@ai:` at cursor |
| `/save-query` | Save the current query |
| `/new-query` | Start a new query |
| `/rename-query` | Rename the active query |
| `/delete-query` | Delete the active query |
| `/switch-query` | Switch to another query |
| `/exit` | Disconnect and return to connection select |

<script setup>
import ConnectionSelectDemo from '../.vitepress/theme/components/ConnectionSelectDemo.vue'
import ConnectionFormDemo from '../.vitepress/theme/components/ConnectionFormDemo.vue'
import MainScreenDemo from '../.vitepress/theme/components/MainScreenDemo.vue'
import CommandPaletteDemo from '../.vitepress/theme/components/CommandPaletteDemo.vue'
import HelpModalDemo from '../.vitepress/theme/components/HelpModalDemo.vue'
import AiConfigDemo from '../.vitepress/theme/components/AiConfigDemo.vue'
</script>
