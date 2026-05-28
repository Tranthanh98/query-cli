import { test, expect } from "bun:test"
import { stripCodeFences } from "./strip-fences"

test("returns plain text unchanged", () => {
  expect(stripCodeFences("SELECT 1")).toBe("SELECT 1")
})

test("strips ```sql ... ``` fence", () => {
  expect(stripCodeFences("```sql\nSELECT 1\n```")).toBe("SELECT 1")
})

test("strips ``` ... ``` fence without language", () => {
  expect(stripCodeFences("```\nSELECT 1\n```")).toBe("SELECT 1")
})

test("trims surrounding whitespace", () => {
  expect(stripCodeFences("  \n\nSELECT 1\n  ")).toBe("SELECT 1")
})

test("preserves inner newlines", () => {
  expect(stripCodeFences("```sql\nSELECT *\nFROM t\n```")).toBe("SELECT *\nFROM t")
})

test("handles fence on same line as content", () => {
  expect(stripCodeFences("```sql SELECT 1 ```")).toBe("SELECT 1")
})
