# AI Providers

`query-cli` supports multiple AI providers for generating and explaining SQL directly inside the editor.

## Supported Providers

| Provider | Models |
|---|---|
| **Anthropic** | Claude |
| **OpenAI** | GPT |
| **OpenRouter** | Various |
| **Google Gemini** | Gemini |

## Configuration

AI settings (API keys, model selection) are configured in-app via the **AI Config** modal:

1. Open the command palette: `Ctrl + P`
2. Select "Configure AI"
3. Choose your provider and enter the API key

No manual config files are required.

## Privacy

API keys are stored locally in your config directory (`~/.config/query-cli/`). They are never sent to any server other than the provider's API.
