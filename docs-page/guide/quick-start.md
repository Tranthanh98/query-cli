# Quick Start

Get up and running with query-cli in under a minute.

## Launch

```bash
query-cli
```

On first launch, you'll land on the **connection selection** screen.

<ConnectionSelectDemo />

## Add a Connection

1. Select **+ New connection**
2. Choose your database driver (PostgreSQL, MySQL, or SQLite)
3. Fill in the connection details
4. Press `Enter` to connect

<ConnectionFormDemo />

## Start Querying

Once connected, the main interface appears:

- **Left panel**: Schema explorer — browse tables, columns, and indexes
- **Top right**: Query editor — write SQL with syntax highlighting
- **Bottom right**: Result panel — view query output

<MainScreenDemo />

### Run a Query

1. Type your SQL in the editor
2. Press `F5` or `Ctrl+R` to run
3. Results appear in the bottom panel

### Use Slash Commands

Type `/` in the editor to see available commands:

- `/run` — Execute the current query
- `/save-query` — Save the current query
- `/new-query` — Start a new query
- `/ai-config` — Configure AI assistant
- `/help` — Show keyboard shortcuts

<CommandPaletteDemo />

## Next Steps

- Learn all [keybindings](./keybindings.md)
- Set up the [AI Assistant](./ai-providers.md)
- Read about [Connection Management](./connections.md)

<script setup>
import ConnectionSelectDemo from '../.vitepress/theme/components/ConnectionSelectDemo.vue'
import ConnectionFormDemo from '../.vitepress/theme/components/ConnectionFormDemo.vue'
import MainScreenDemo from '../.vitepress/theme/components/MainScreenDemo.vue'
import CommandPaletteDemo from '../.vitepress/theme/components/CommandPaletteDemo.vue'
</script>
