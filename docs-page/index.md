---
layout: home

hero:
  name: ">_ query_cli"
  text: Terminal Database Client
  tagline: A keyboard-driven TUI with multi-connection support, query editor, schema explorer, and built-in AI assistance.
  actions:
    - theme: brand
      text: Get Started
      link: /guide/introduction
    - theme: alt
      text: View on GitHub
      link: https://github.com/Tranthanh98/query-cli

features:
  - icon: 🖥️
    title: Keyboard-driven TUI
    details: Built with OpenTUI and React. Navigate, edit, and run queries entirely from the keyboard.
  - icon: 🗄️
    title: Multi-database Support
    details: Connect to PostgreSQL, SQLite, and MySQL from a single interface.
  - icon: 🤖
    title: AI Assistant
    details: Generate and explain SQL using Anthropic, OpenAI, OpenRouter, or Google Gemini.
  - icon: 📋
    title: Query Editor
    details: Tabbed queries with save/rename, syntax highlighting, and clipboard copy.
  - icon: 🔍
    title: Schema Explorer
    details: Browse tables, columns, and indexes side-by-side without leaving the terminal.
  - icon: ⌨️
    title: Slash Commands
    details: Quick actions like /export, /clear, /quit, and more right inside the editor.
---

<script setup>
import ConnectionSelectDemo from './.vitepress/theme/components/ConnectionSelectDemo.vue'
import ConnectionFormDemo from './.vitepress/theme/components/ConnectionFormDemo.vue'
import MainScreenDemo from './.vitepress/theme/components/MainScreenDemo.vue'
import CommandPaletteDemo from './.vitepress/theme/components/CommandPaletteDemo.vue'
import HelpModalDemo from './.vitepress/theme/components/HelpModalDemo.vue'
import AiDemo from './.vitepress/theme/components/AiDemo.vue'
</script>

<div style="margin-top: 40px;">

## See it in action

### Connection Manager

Select, create, and manage your database connections from a clean terminal interface.

<div class="terminal-grid">
  <ConnectionSelectDemo />
  <ConnectionFormDemo />
</div>

### Main Interface

The main screen splits into a schema explorer, query editor, and result panel — all inside your terminal.

<MainScreenDemo />

### Command Palette & Help

Access every feature through the searchable command palette. Never forget a shortcut — press `F1` or `Ctrl+H` anytime.

<div class="terminal-grid">
  <CommandPaletteDemo />
  <HelpModalDemo />
</div>

### AI Configuration

Configure AI providers directly in the app — no manual file editing needed.

<AiDemo />

</div>

<style scoped>
.VPFeatures {
  margin-top: 40px !important;
}
</style>
