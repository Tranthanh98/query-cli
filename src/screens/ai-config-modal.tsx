import type { InputRenderable, SelectOption } from "@opentui/core"
import { useKeyboard } from "@opentui/react"
import { useEffect, useRef, useState } from "react"
import { AVAILABLE_AI_ADAPTERS } from "../ai/registry"
import {
  DEFAULT_MODELS,
  envVarHint,
  hasConfiguredKey,
  loadAiConfig,
  saveAiConfig,
  type AiConfig,
} from "../ai/config"
import type { AiAdapterKind } from "../ai/types"
import { colors } from "../theme"

const ADAPTER_LABELS: Record<AiAdapterKind, { name: string; description: string }> = {
  anthropic: {
    name: "Anthropic Claude",
    description: "anthropic · needs ANTHROPIC_API_KEY",
  },
  openai: {
    name: "OpenAI",
    description: "openai · needs OPENAI_API_KEY",
  },
  openrouter: {
    name: "OpenRouter",
    description: "openrouter · needs OPENROUTER_API_KEY · free models with :free suffix",
  },
  gemini: {
    name: "Google Gemini",
    description: "gemini · needs GEMINI_API_KEY (free tier available)",
  },
}

type Step = "adapter" | "form"
type FocusField = "key" | "model"

interface AiConfigModalProps {
  open: boolean
  onClose(): void
  onSaved(): void
}

export function AiConfigModal({ open, onClose, onSaved }: AiConfigModalProps) {
  const [existing, setExisting] = useState<AiConfig | null>(null)
  const [step, setStep] = useState<Step>("adapter")
  const [adapter, setAdapter] = useState<AiAdapterKind | null>(null)
  const [apiKey, setApiKey] = useState("")
  const [model, setModel] = useState("")
  const [focusField, setFocusField] = useState<FocusField>("key")
  const [error, setError] = useState<string | null>(null)
  const keyInputRef = useRef<InputRenderable | null>(null)
  const modelInputRef = useRef<InputRenderable | null>(null)

  useEffect(() => {
    if (!open) return
    setStep("adapter")
    setAdapter(null)
    setApiKey("")
    setModel("")
    setFocusField("key")
    setError(null)
    void loadAiConfig().then(setExisting)
  }, [open])

  useKeyboard((key) => {
    if (!open) return
    if (key.name === "escape") {
      onClose()
      return
    }
    if (step === "form" && key.name === "tab") {
      key.preventDefault()
      setFocusField((f) => (f === "key" ? "model" : "key"))
    }
  })

  if (!open) return null

  if (step === "adapter") {
    const options: SelectOption[] = AVAILABLE_AI_ADAPTERS.map((kind) => {
      const state = hasConfiguredKey(kind, existing)
      const indicator =
        state === "stored" ? " ✓ key saved"
        : state === "env" ? " ✓ env var set"
        : ""
      const activeMark = existing?.adapter === kind ? " · active" : ""
      return {
        name: `${ADAPTER_LABELS[kind].name}${indicator}${activeMark}`,
        description: ADAPTER_LABELS[kind].description,
        value: kind,
      }
    })
    return (
      <ModalShell title=" AI adapter ">
        <box flexDirection="row" gap={1}>
          <text fg={colors.command}>↑/↓</text>
          <text fg={colors.textDim}>navigate</text>
          <text fg={colors.textMuted}>·</text>
          <text fg={colors.command}>enter</text>
          <text fg={colors.textDim}>select</text>
          <text fg={colors.textMuted}>·</text>
          <text fg={colors.command}>esc</text>
          <text fg={colors.textDim}>cancel</text>
        </box>
        <select
          width={60}
          height={Math.max(8, options.length + 2)}
          options={options}
          wrapSelection
          focused
          onSelect={(_idx, opt) => {
            if (!opt) return
            const kind = opt.value as AiAdapterKind
            setAdapter(kind)
            setApiKey(existing?.apiKeys?.[kind] ?? "")
            setModel(
              existing?.adapter === kind && existing?.model
                ? existing.model
                : DEFAULT_MODELS[kind],
            )
            setFocusField("key")
            setStep("form")
          }}
        />
      </ModalShell>
    )
  }

  if (step === "form" && adapter) {
    const handleSave = async () => {
      const trimmedKey = apiKey.trim()
      const trimmedModel = model.trim() || DEFAULT_MODELS[adapter]
      const nextApiKeys = { ...(existing?.apiKeys ?? {}) }
      if (trimmedKey) {
        nextApiKeys[adapter] = trimmedKey
      } else {
        delete nextApiKeys[adapter]
      }
      try {
        await saveAiConfig({
          adapter,
          model: trimmedModel,
          apiKeys: Object.keys(nextApiKeys).length > 0 ? nextApiKeys : undefined,
        })
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e))
        return
      }
      onSaved()
      onClose()
    }

    return (
      <ModalShell title={` Configure · ${ADAPTER_LABELS[adapter].name} `}>
        {error ? <text fg={colors.error}>{`✗ ${error}`}</text> : null}

        <text fg={colors.section}>API key</text>
        <input
          ref={(el) => {
            keyInputRef.current = el
          }}
          width={60}
          placeholder={existing?.apiKeys?.[adapter] ? "(keeping saved key)" : "paste API key here"}
          placeholderColor={colors.textMuted}
          value={apiKey}
          focused={focusField === "key"}
          onInput={(v: string) => {
            setApiKey(v)
            if (error) setError(null)
          }}
          onSubmit={() => {
            void handleSave()
          }}
        />
        <box flexDirection="row" gap={1}>
          <text fg={colors.textDim}>leave blank to fall back to env var</text>
          <text fg={colors.command}>{envVarHint(adapter)}</text>
        </box>

        <text fg={colors.section}>Model</text>
        <input
          ref={(el) => {
            modelInputRef.current = el
          }}
          width={60}
          placeholder={DEFAULT_MODELS[adapter]}
          placeholderColor={colors.textMuted}
          value={model}
          focused={focusField === "model"}
          onInput={(v: string) => {
            setModel(v)
            if (error) setError(null)
          }}
          onSubmit={() => {
            void handleSave()
          }}
        />
        <box flexDirection="row" gap={1}>
          <text fg={colors.textDim}>default:</text>
          <text fg={colors.command}>{DEFAULT_MODELS[adapter]}</text>
        </box>

        <box flexDirection="row" gap={1}>
          <text fg={colors.command}>tab</text>
          <text fg={colors.textDim}>switch field</text>
          <text fg={colors.textMuted}>·</text>
          <text fg={colors.command}>enter</text>
          <text fg={colors.textDim}>save</text>
          <text fg={colors.textMuted}>·</text>
          <text fg={colors.command}>esc</text>
          <text fg={colors.textDim}>cancel</text>
        </box>
      </ModalShell>
    )
  }

  return null
}

function ModalShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <box
      position="absolute"
      left={0}
      top={0}
      right={0}
      bottom={0}
      justifyContent="center"
      alignItems="center"
    >
      <box
        borderStyle="rounded"
        borderColor={colors.panelQuery}
        padding={1}
        title={title}
        titleAlignment="left"
        flexDirection="column"
        gap={1}
        backgroundColor={colors.surfaceAlt}
      >
        {children}
      </box>
    </box>
  )
}
