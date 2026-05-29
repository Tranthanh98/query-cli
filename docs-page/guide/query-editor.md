# Query Editor

The query editor is the heart of query-cli. It provides a rich SQL editing experience inside your terminal.

<MainScreenDemo />

## Features

### Syntax Highlighting

SQL keywords, table names, and column names are highlighted in real-time as you type. The editor is schema-aware — it recognizes your database tables and columns for accurate highlighting.

### Tabbed Queries

Work on multiple queries simultaneously:

- `Ctrl+N` — New query
- `Ctrl+D` — Delete active query
- `/switch-query` — Switch between queries
- `/rename-query` — Rename a query

### Auto-complete

Press `Tab` to accept suggestions for:

- SQL keywords (`SELECT`, `FROM`, `WHERE`, etc.)
- Table names from your schema
- Column names (with `table.column` support)
- Slash commands

### Running Queries

- `F5` or `Ctrl+R` — Run the current statement or batch
- Statements separated by `---` (3+ dashes) run independently
- Multiple `;`-separated statements run as a batch

### Results

Query results appear in the bottom panel:

- **Data queries** — Displayed as formatted tables
- **INSERT/UPDATE/DELETE** — Show affected row count
- **Errors** — Displayed with the failing statement
- **Multiple results** — Tabbed result view for batch queries

Result rows are capped at a safe limit. If truncated, a warning suggests adding `LIMIT` or `WHERE`.

### Clipboard

- `Ctrl+Y` — Copy the current selection to your system clipboard

### Save & Load

- `Ctrl+S` — Save the current query with a name
- Saved queries persist across sessions in `~/.config/query-cli/queries/`
- Unsaved queries are automatically restored on reconnect

## AI Integration

Type `@ai:` followed by your request to generate SQL:

```sql
@ai: find all users who signed up in the last 30 days
```

Press `Enter` and AI replaces the prompt with generated SQL.

<script setup>
import MainScreenDemo from '../.vitepress/theme/components/MainScreenDemo.vue'
</script>
