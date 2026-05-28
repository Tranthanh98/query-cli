import type { InputRenderable } from "@opentui/core"
import { useKeyboard } from "@opentui/react"
import { useEffect, useRef, useState } from "react"
import { useQueries } from "../queries-context"
import { colors } from "../theme"

export function InputPromptModal() {
  const { inputPrompt, closeInputPrompt } = useQueries()
  const [value, setValue] = useState("")
  const inputRef = useRef<InputRenderable | null>(null)

  useEffect(() => {
    if (inputPrompt) {
      setValue(inputPrompt.initialValue ?? "")
    }
  }, [inputPrompt])

  useKeyboard((key) => {
    if (!inputPrompt) return
    if (key.name === "escape") {
      closeInputPrompt()
    }
  })

  if (!inputPrompt) return null

  const handleSubmit = async () => {
    const trimmed = value.trim()
    if (!trimmed) return
    const onConfirm = inputPrompt.onConfirm
    closeInputPrompt()
    await onConfirm(trimmed)
  }

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
        borderColor={colors.panelQueries}
        padding={1}
        title={` ${inputPrompt.title} `}
        titleAlignment="left"
        flexDirection="column"
        gap={1}
        backgroundColor={colors.surfaceAlt}
      >
        <input
          ref={(el) => {
            inputRef.current = el
          }}
          width={50}
          placeholder={inputPrompt.placeholder ?? ""}
          placeholderColor={colors.textMuted}
          value={value}
          focused
          onInput={setValue}
          onSubmit={() => {
            void handleSubmit()
          }}
        />
        <box flexDirection="row" gap={1}>
          <text fg={colors.command}>enter</text>
          <text fg={colors.textDim}>confirm</text>
          <text fg={colors.textMuted}>·</text>
          <text fg={colors.command}>esc</text>
          <text fg={colors.textDim}>cancel</text>
        </box>
      </box>
    </box>
  )
}
