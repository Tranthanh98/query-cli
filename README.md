# query-cli

A terminal database client with a keyboard-driven TUI, multi-connection support, and built-in AI assistance.

![Bun](https://img.shields.io/badge/Bun-000000?logo=bun&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)

## Features

- **Multi-database support** — PostgreSQL, SQLite, and MySQL
- **Keyboard-driven TUI** — built with [OpenTUI](https://opentui.com) and React
- **Query editor** — tabbed queries with syntax highlighting, save/rename, and clipboard copy
- **Schema explorer** — browse tables, columns, and indexes side-by-side
- **AI assistant** — generate and explain SQL using Anthropic, OpenAI, OpenRouter, or Google Gemini
- **Slash commands** — quick actions like `/export`, `/clear`, `/quit`, and more
- **Connection manager** — save, edit, and switch between database connections

## Install

```bash
npm i -g query-cli
```

`query-cli` is distributed as a self-contained binary per platform, so you don't need Bun or Node.js installed.

## Usage

```bash
query-cli
```

On first launch, you'll land on the **connection selection** screen. Add a new connection, pick a driver, and start querying.

### Keybindings

| Key (Linux / Windows) | macOS | Action |
|---|---|---|
| `F5` / `Ctrl + R` | `F5` / `Control + R` | Run query |
| `F9` / `Ctrl + P` | `F9` / `Control + P` | Open command palette |
| `F1` / `Ctrl + H` | `F1` / `Control + H` | Show keyboard shortcuts help |
| `Ctrl + Y` | `Control + Y` | Copy selection to clipboard |
| `Ctrl + C` | `Control + C` | Quit |

> Tab management (new, switch, save, rename, delete) and other actions are available through slash commands in the editor — type `/` to see the list.

## Development

query-cli requires [Bun](https://bun.com). It uses OpenTUI's native Zig libraries and will not run on Node.js.

```bash
# Install dependencies
bun install

# Run in watch mode
bun run dev

# Run once
bun run start

# Type check
bun run typecheck

# Compile standalone binary
bun run compile
```

## Project Structure

```
src/
├── drivers/          # Database drivers (postgres, sqlite, mysql)
├── screens/          # TUI screens (connection select, form, main, modals)
├── components/       # Reusable TUI components (editor, result panel, etc.)
├── commands/         # Slash command registry
├── ai/               # AI provider adapters (anthropic, openai, gemini, openrouter)
├── config/           # Connection and query persistence
├── lib/              # Utilities (clipboard, etc.)
├── app.tsx           # Root app with screen router
└── index.tsx         # Entry point
```

## Configuration

Saved connections and queries are stored in:

```
~/.config/query-cli/
├── connections.json
└── queries/
```

AI provider settings (API keys, model selection) are configured in-app via the **AI Config** modal (`Ctrl + P` → "Configure AI").

## Supported AI Providers

- **Anthropic** (Claude)
- **OpenAI** (GPT)
- **OpenRouter**
- **Google Gemini**

## Supported Databases

| Driver | Status |
|--------|--------|
| PostgreSQL | ✅ |
| SQLite | ✅ |
| MySQL | ✅ |

## Release

Releases are built and published via GitHub Actions. See [PUBLISHING.md](./PUBLISHING.md) for details on the multi-platform binary distribution model.

## License

MIT
