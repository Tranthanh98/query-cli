# AI Assistant

query-cli supports multiple AI providers for generating and explaining SQL directly inside the editor.

<AiConfigDemo />

## Supported Providers

| Provider | Models | Environment Variable |
|---|---|---|
| **Anthropic** | Claude | `ANTHROPIC_API_KEY` |
| **OpenAI** | GPT | `OPENAI_API_KEY` |
| **OpenRouter** | Various | `OPENROUTER_API_KEY` |
| **Google Gemini** | Gemini | `GEMINI_API_KEY` |

## Configuration

AI settings (API keys, model selection) are configured in-app via the **AI Config** modal:

1. Open the command palette: `Ctrl + P`
2. Select "Configure AI"
3. Choose your provider and enter the API key

No manual config files are required, though they can be edited directly in `~/.config/query-cli/ai-config.json`.

### Default Models

Each provider has a sensible default model selected. You can override it in the config form:

- **Anthropic**: `claude-3-5-sonnet-20241022`
- **OpenAI**: `gpt-4o`
- **OpenRouter**: `openai/gpt-4o`
- **Gemini**: `gemini-1.5-flash-latest`

## Using AI in the Editor

### @ai Prompts

Type `@ai:` followed by your request in the editor:

```sql
@ai: find all users who signed up in the last 30 days and have made at least one purchase
```

Press `Enter` and AI will replace the prompt with generated SQL:

```sql
--- @ai: find all users who signed up in the last 30 days and have made at least one purchase
SELECT u.*
FROM users u
WHERE u.created_at >= NOW() - INTERVAL '30 days'
  AND EXISTS (
    SELECT 1 FROM orders o WHERE o.user_id = u.id
  );
```

### Context Awareness

AI prompts include context from your database schema (visible tables, columns) so generated SQL is relevant to your actual database structure.

### /ask-ai Command

Type `/ask-ai` to quickly insert `@ai:` at the cursor position.

## Privacy

API keys are stored locally in your config directory (`~/.config/query-cli/`). They are never sent to any server other than the provider's API.

## Troubleshooting

| Issue | Solution |
|---|---|
| "No AI adapter configured" | Run `/ai-config` to set up a provider |
| "Rate limited" | Wait a moment and retry |
| "AI gave up after X tool calls" | Simplify your prompt |
| Model not responding | Check your API key and internet connection |

<script setup>
import AiConfigDemo from '../.vitepress/theme/components/AiConfigDemo.vue'
</script>
