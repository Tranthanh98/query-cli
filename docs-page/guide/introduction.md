# Introduction

**query-cli** is a terminal database client designed for developers who prefer staying in the terminal. It combines a fast, keyboard-driven TUI with powerful features like multi-connection management, a built-in query editor, schema exploration, and AI-assisted SQL generation.

<ConnectionSelectDemo />

## Why query-cli?

- **All-in-one terminal workflow** — no need to switch to a GUI tool or web interface.
- **Multi-database** — manage PostgreSQL, SQLite, and MySQL connections in one place.
- **AI-powered** — get SQL suggestions and explanations without leaving the editor.
- **Lightweight** — distributed as a self-contained binary; no runtime dependencies.

## Quick Start

1. Install globally:

   ```bash
   npm i -g query-cli
   ```

2. Launch:

   ```bash
   query-cli
   ```

3. Add your first connection and start querying.

## Architecture Overview

- **TUI** — Screen-based routing (select → form → main) via React Context.
- **Drivers** — Pluggable database drivers under `src/drivers/`.
- **State** — Spread across React contexts for app, queries, schema, toasts, and AI.
- **AI Providers** — Modular integrations for Anthropic, Google, OpenAI, and OpenRouter.

See the [Installation](./installation.md) page for detailed setup instructions.

<script setup>
import ConnectionSelectDemo from '../.vitepress/theme/components/ConnectionSelectDemo.vue'
</script>
