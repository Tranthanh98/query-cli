export function stripCodeFences(text: string): string {
  let s = text.trim()
  const fenceMatch = s.match(/^```(?:sql)?\s*([\s\S]*?)\s*```$/i)
  if (fenceMatch) s = fenceMatch[1]!
  return s.trim()
}
