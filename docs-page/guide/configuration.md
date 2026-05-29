# Configuration

query-cli stores configuration in a local directory. Most settings are managed in-app, but knowing where files live is useful for backup or troubleshooting.

## Config Directory

```
~/.config/query-cli/
├── connections.json
├── queries/
│   ├── query-1.json
│   ├── query-2.json
│   └── ...
└── ai-config.json
```

## Connections

Saved connections are stored in `connections.json`. You can:

- Edit this file manually (not recommended)
- Delete it to reset all connections
- Back it up to transfer connections between machines

## Queries

Saved queries are stored as individual JSON files in `queries/`:

```json
{
  "id": "abc123",
  "name": "Active users",
  "text": "SELECT * FROM users WHERE active = true;",
  "saved": true
}
```

## AI Configuration

AI settings are stored in `ai-config.json`:

```json
{
  "adapter": "anthropic",
  "model": "claude-3-5-sonnet-20241022",
  "apiKeys": {
    "anthropic": "sk-ant-..."
  }
}
```

API keys can also be provided via environment variables:

| Provider | Environment Variable |
|----------|---------------------|
| Anthropic | `ANTHROPIC_API_KEY` |
| OpenAI | `OPENAI_API_KEY` |
| OpenRouter | `OPENROUTER_API_KEY` |
| Google Gemini | `GEMINI_API_KEY` |

If both an env var and a saved key exist, the saved key takes precedence.

## In-App Configuration

The recommended way to configure AI is through the app:

1. Open the command palette: `Ctrl+P`
2. Select "Configure AI"
3. Choose your provider
4. Enter API key and model

<AiConfigDemo />

## Terminal Settings

### Flow Control (Unix)

`Ctrl+S` may freeze some Unix terminals due to XOFF flow control. If this happens:

- Press `Ctrl+Q` to resume
- Or disable flow control permanently: `stty -ixon`

### Mouse Support

query-cli supports mouse interaction in terminals that have it enabled. This lets you:

- Click connections to select
- Click the run button
- Click result tabs
- Click table names in the explorer

<script setup>
import AiConfigDemo from '../.vitepress/theme/components/AiConfigDemo.vue'
</script>
