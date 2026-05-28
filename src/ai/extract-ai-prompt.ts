export interface AiPromptMatch {
  prompt: string
  blockContext: string
  range: { start: number; end: number }
}

export function extractAiPrompt(
  blockText: string,
  blockStart: number,
): AiPromptMatch | null {
  const lines = blockText.split("\n")
  let aiLineIdx = -1
  let promptText = ""
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i]!.trimStart()
    if (trimmed.startsWith("@ai:")) {
      aiLineIdx = i
      promptText = trimmed.slice("@ai:".length).trim()
      break
    }
  }
  if (aiLineIdx === -1) return null
  const blockContext = lines
    .filter((_, i) => i !== aiLineIdx)
    .join("\n")
    .trim()
  return {
    prompt: promptText,
    blockContext,
    range: { start: blockStart, end: blockStart + blockText.length },
  }
}
