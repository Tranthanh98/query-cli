# query-cli

A terminal database client with a keyboard-driven TUI, multi-connection support, and built-in AI assistance.

![Bun](https://img.shields.io/badge/Bun-000000?logo=bun&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
[![npm](https://img.shields.io/npm/v/query-cli?label=npm&logo=npm)](https://www.npmjs.com/package/query-cli)

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
# npm
npm i -g query-cli

# pnpm
pnpm add -g query-cli

# yarn
yarn global add query-cli

# bun
bun add -g query-cli
```

Or run once without installing:

```bash
npx query-cli
```

`query-cli` is distributed as a self-contained binary per platform, so you don't need Bun or Node.js installed.

> **Homebrew** and **Winget** distribution is planned. See [PUBLISHING.md](./PUBLISHING.md) for the current npm-based distribution model.

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
| `Ctrl + S` | `Control + S` | Save query |
| `Ctrl + N` | `Control + N` | New query |
| `Ctrl + D` | `Control + D` | Delete query |
| `Ctrl + Y` | `Control + Y` | Copy selection to clipboard |
| `F1` / `Ctrl + H` | `F1` / `Control + H` | Show keyboard shortcuts help |
| `Ctrl + C` | `Control + C` | Quit |

> **Note:** `Ctrl+S` may freeze some Unix terminals (XOFF). Press `Ctrl+Q` to resume, or disable flow control with `stty -ixon`.

> Tab management (new, switch, save, rename, delete) and other actions are available through slash commands in the editor — type `/` to see the list.

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
