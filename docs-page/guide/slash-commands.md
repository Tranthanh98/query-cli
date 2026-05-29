# Slash Commands

Slash commands provide quick actions inside the query editor. Type `/` followed by a command name to execute it.

<CommandPaletteDemo />

## Available Commands

| Command | Description | Confirm? |
|---------|-------------|----------|
| `/run` | Execute the current query | No |
| `/commands` | Open the command palette | No |
| `/help` | Show keyboard shortcuts | No |
| `/ai-config` | Pick an AI adapter and model | No |
| `/ask-ai` | Insert `@ai:` at the cursor | No |
| `/save-query` | Save the current query under a name | No |
| `/new-query` | Start a new empty query | No |
| `/rename-query` | Rename the active query | No |
| `/delete-query` | Delete the active query | Yes |
| `/switch-query` | Switch to another saved query | No |
| `/exit` | Disconnect and return to connection select | Yes (if unsaved) |

## Using Commands

1. Type `/` in the editor
2. A suggestion popup appears with matching commands
3. Use `↑/↓` to navigate and `Tab` or `Enter` to accept

### Examples

```sql
-- Save your current work
/save-query

-- Start fresh
/new-query

-- Get AI help
/ask-ai

-- Then type your request:
@ai: show me all active users
```

## Command Palette

The command palette (`F9` or `Ctrl+P`) provides a searchable list of all commands:

<CommandPaletteDemo />

<script setup>
import CommandPaletteDemo from '../.vitepress/theme/components/CommandPaletteDemo.vue'
</script>
