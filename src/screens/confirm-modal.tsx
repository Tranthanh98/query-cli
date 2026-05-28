import { useKeyboard } from "@opentui/react"
import type { SelectOption } from "@opentui/core"
import { useApp } from "../app-context"
import { colors } from "../theme"

export function ConfirmModal() {
  const { confirmRequest, closeConfirm } = useApp()

  useKeyboard((key) => {
    if (!confirmRequest) return
    if (key.name === "escape" || key.name === "n") {
      closeConfirm()
    } else if (key.name === "y") {
      const onConfirm = confirmRequest.onConfirm
      closeConfirm()
      void onConfirm()
    }
  })

  if (!confirmRequest) return null

  const options = [
    { name: "Yes", description: "Confirm", value: "yes" },
    { name: "No", description: "Cancel", value: "no" },
  ]

  const handleSelect = async (_idx: number, opt: SelectOption | null) => {
    if (!opt) return
    if (opt.value === "yes") {
      const onConfirm = confirmRequest.onConfirm
      closeConfirm()
      await onConfirm()
    } else {
      closeConfirm()
    }
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
        borderColor={colors.warning}
        padding={1}
        title={` ${confirmRequest.title ?? "Confirm"} `}
        titleAlignment="left"
        flexDirection="column"
        gap={1}
        backgroundColor={colors.surfaceAlt}
      >
        <text fg={colors.text}>{confirmRequest.message}</text>
        <box flexDirection="row" gap={1}>
          <text fg={colors.command}>y</text>
          <text fg={colors.textDim}>confirm</text>
          <text fg={colors.textMuted}>·</text>
          <text fg={colors.command}>n / esc</text>
          <text fg={colors.textDim}>cancel</text>
        </box>
        <select
          width={40}
          height={3}
          options={options}
          focused
          onSelect={handleSelect}
        />
      </box>
    </box>
  )
}
