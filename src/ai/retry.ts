import { AiRateLimitError } from "./types"

export interface RetryOptions {
  signal: AbortSignal
  isRateLimit: (e: unknown) => boolean
  sleep?: (ms: number) => Promise<void>
}

const DELAYS_MS = [1000, 2000, 4000]

export async function retryOnRateLimit<T>(
  fn: () => Promise<T>,
  opts: RetryOptions,
): Promise<T> {
  const sleep = opts.sleep ?? defaultSleep
  let lastErr: unknown
  for (let attempt = 0; attempt <= DELAYS_MS.length; attempt++) {
    if (opts.signal.aborted) throw abortError()
    try {
      return await fn()
    } catch (e) {
      lastErr = e
      if (!opts.isRateLimit(e)) throw e
      if (attempt === DELAYS_MS.length) throw new AiRateLimitError(e)
      await sleep(DELAYS_MS[attempt]!)
    }
  }
  throw lastErr
}

function defaultSleep(ms: number): Promise<void> {
  return new Promise((res) => setTimeout(res, ms))
}

function abortError(): DOMException {
  return new DOMException("Aborted", "AbortError")
}
