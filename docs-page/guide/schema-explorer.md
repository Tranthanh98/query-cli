# Schema Explorer

Browse your database schema without leaving the terminal. The schema explorer sits in the left panel of the main screen.

<MainScreenDemo />

## Features

### Table List

All tables in your connected database are listed in the explorer:

- Tables are shown in schema-qualified format (`schema.table` for PostgreSQL)
- Pagination for large databases (e.g., "20 of 76")
- **Load more** button to fetch additional tables

### Column Discovery

Expand any table to see its columns:

- Column names and types
- Primary key indicators
- Index information

The schema data is cached and used to power:

- **Syntax highlighting** — Table and column names get colored
- **Auto-complete** — Type `table.` and see available columns
- **AI context** — Schema is included when AI generates SQL

### Search

Filter the table list by typing in the search box. Only matching tables are shown.

### Schema-Aware Editor

As you type SQL, the editor:

1. Recognizes `FROM` and `JOIN` clauses
2. Pre-loads column data for referenced tables
3. Suggests columns when you type `alias.`

## Navigation

The explorer responds to mouse interaction in terminals that support it. Use arrow keys or `j/k` to navigate in keyboard-only terminals.

<script setup>
import MainScreenDemo from '../.vitepress/theme/components/MainScreenDemo.vue'
</script>
