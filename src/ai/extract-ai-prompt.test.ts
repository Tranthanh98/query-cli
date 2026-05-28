import { test, expect } from "bun:test"
import { extractAiPrompt } from "./extract-ai-prompt"

test("returns null when no @ai: line present", () => {
  expect(extractAiPrompt("SELECT 1", 0)).toBeNull()
})

test("detects a bare @ai: line", () => {
  const text = "@ai: list active users"
  const result = extractAiPrompt(text, 0)
  expect(result).toEqual({
    prompt: "list active users",
    blockContext: "",
    range: { start: 0, end: text.length },
  })
})

test("detects @ai: with leading whitespace", () => {
  const text = "  @ai: count rows"
  const result = extractAiPrompt(text, 0)
  expect(result?.prompt).toBe("count rows")
})

test("captures surrounding SQL as blockContext and includes it in range", () => {
  const text = "SELECT id FROM users\n@ai: also include email"
  const result = extractAiPrompt(text, 0)
  expect(result?.prompt).toBe("also include email")
  expect(result?.blockContext).toBe("SELECT id FROM users")
  expect(result?.range).toEqual({ start: 0, end: text.length })
})

test("uses the first @ai: when multiple are present", () => {
  const text = "@ai: first\n@ai: second"
  const result = extractAiPrompt(text, 0)
  expect(result?.prompt).toBe("first")
  expect(result?.blockContext).toBe("@ai: second")
})

test("range is offset by blockStart", () => {
  const text = "@ai: x"
  const result = extractAiPrompt(text, 42)
  expect(result?.range).toEqual({ start: 42, end: 42 + text.length })
})

test("trims trailing whitespace from prompt", () => {
  expect(extractAiPrompt("@ai:   hello   ", 0)?.prompt).toBe("hello")
})
