import { test, expect } from "bun:test"
import { retryOnRateLimit } from "./retry"

const noopSignal = new AbortController().signal
const isRateLimit = (e: unknown) => (e as { code?: string })?.code === "RATE_LIMIT"

test("returns value on first success", async () => {
  let calls = 0
  const result = await retryOnRateLimit(
    async () => { calls++; return 42 },
    { signal: noopSignal, isRateLimit, sleep: async () => {} },
  )
  expect(result).toBe(42)
  expect(calls).toBe(1)
})

test("retries on rate-limit error then succeeds", async () => {
  let calls = 0
  const result = await retryOnRateLimit(
    async () => {
      calls++
      if (calls < 3) throw { code: "RATE_LIMIT" }
      return "ok"
    },
    { signal: noopSignal, isRateLimit, sleep: async () => {} },
  )
  expect(result).toBe("ok")
  expect(calls).toBe(3)
})

test("gives up after 3 retries by throwing AiRateLimitError wrapping the cause", async () => {
  let calls = 0
  const err = { code: "RATE_LIMIT" }
  await expect(
    retryOnRateLimit(
      async () => { calls++; throw err },
      { signal: noopSignal, isRateLimit, sleep: async () => {} },
    ),
  ).rejects.toMatchObject({ name: "AiRateLimitError", cause: err })
  expect(calls).toBe(4) // 1 initial + 3 retries
})

test("non-rate-limit errors are not retried", async () => {
  let calls = 0
  const err = new Error("network down")
  await expect(
    retryOnRateLimit(
      async () => { calls++; throw err },
      { signal: noopSignal, isRateLimit, sleep: async () => {} },
    ),
  ).rejects.toBe(err)
  expect(calls).toBe(1)
})

test("aborts before sleeping", async () => {
  const controller = new AbortController()
  let calls = 0
  controller.abort()
  await expect(
    retryOnRateLimit(
      async () => { calls++; throw { code: "RATE_LIMIT" } },
      { signal: controller.signal, isRateLimit, sleep: async () => {} },
    ),
  ).rejects.toMatchObject({ name: "AbortError" })
  expect(calls).toBe(0) // signal already aborted — fn never called
})

test("uses exponential backoff delays", async () => {
  const delays: number[] = []
  let calls = 0
  await expect(
    retryOnRateLimit(
      async () => { calls++; throw { code: "RATE_LIMIT" } },
      {
        signal: noopSignal,
        isRateLimit,
        sleep: async (ms: number) => { delays.push(ms) },
      },
    ),
  ).rejects.toBeDefined()
  expect(delays).toEqual([1000, 2000, 4000])
})
