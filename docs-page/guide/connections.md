# Connection Manager

query-cli makes it easy to manage multiple database connections from a single interface.

## Supported Databases

| Driver | Status | Default Port |
|--------|--------|-------------|
| PostgreSQL | ✅ | 5432 |
| MySQL | ✅ | 3306 |
| SQLite | ✅ | file path |

## Connection Screen

When you launch query-cli, you'll see the connection selection screen:

<ConnectionSelectDemo />

### Navigation

- `↑/↓` or `j/k` — Navigate connections
- `Enter` — Connect to selected
- `Ctrl+C` — Quit

## Adding a Connection

Select **+ New connection** to create a new profile:

<ConnectionFormDemo />

### PostgreSQL / MySQL Fields

| Field | Description | Default |
|-------|-------------|---------|
| Name | Display name for this connection | auto-generated |
| Host | Database server address | `localhost` |
| Port | Server port | `5432` (PG) / `3306` (MySQL) |
| Database | Database name | — |
| User | Username | `postgres` (PG) / `root` (MySQL) |
| Password | Password (optional) | — |

### SQLite Fields

| Field | Description |
|-------|-------------|
| Name | Display name |
| Database | Path to `.sqlite` file |

### Field Navigation

- `Tab` — Move between fields
- `Enter` — Next field / Connect (on last field)
- `Esc` — Go back

## Saved Connections

Connections are stored in:

```
~/.config/query-cli/connections.json
```

Each saved connection appears on the selection screen for quick reconnection.

## Switching Connections

Use `/exit` in the query editor or press `Ctrl+C` to return to the connection screen. Your unsaved queries can be preserved (you'll be prompted).

<script setup>
import ConnectionSelectDemo from '../.vitepress/theme/components/ConnectionSelectDemo.vue'
import ConnectionFormDemo from '../.vitepress/theme/components/ConnectionFormDemo.vue'
</script>
