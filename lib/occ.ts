// ─────────────────────────────────────────────────────────────
// Optimistic-concurrency retry — this is the heart of the ShipLog story.
//
// Aurora DSQL uses OPTIMISTIC concurrency control with snapshot/serializable
// isolation. Two transactions that touch the SAME row concurrently do NOT
// silently merge or last-write-win: one COMMIT succeeds, the other is REJECTED
// with a retryable serialization failure (SQLSTATE 40001 / OC000). That
// rejection is the guarantee — it's how DSQL makes a silent lost write
// impossible. The correct client behaviour is to retry the whole transaction.
// ─────────────────────────────────────────────────────────────

export class OccConflict extends Error {
  readonly attempts: number
  constructor(attempts: number, cause?: unknown) {
    super(`DSQL optimistic-concurrency conflict after ${attempts} attempts`)
    this.name = 'OccConflict'
    this.attempts = attempts
    if (cause) (this as { cause?: unknown }).cause = cause
  }
}

export function isRetryableConflict(e: unknown): boolean {
  const err = e as { code?: string; message?: string } | null
  if (!err) return false
  // DSQL surfaces OCC/serialization aborts as SQLSTATE 40001 (and OC000-family).
  if (err.code === '40001' || err.code === '40P01' || err.code === 'OC000')
    return true
  return /concurren|serializ|conflict|retry|OC0\d\d/i.test(err.message ?? '')
}

/**
 * Run `fn` (typically a full transaction) and transparently retry it on a DSQL
 * OCC conflict, with exponential backoff + jitter. Non-conflict errors throw
 * immediately. Surfaces how many retries it took so the UI can SHOW the retry.
 */
export async function withOccRetry<T>(
  fn: () => Promise<T>,
  opts: { tries?: number; onRetry?: (attempt: number) => void } = {}
): Promise<{ value: T; retries: number }> {
  const tries = opts.tries ?? 5
  for (let attempt = 0; ; attempt++) {
    try {
      const value = await fn()
      return { value, retries: attempt }
    } catch (e) {
      if (!isRetryableConflict(e) || attempt >= tries) {
        if (isRetryableConflict(e)) throw new OccConflict(attempt, e)
        throw e
      }
      opts.onRetry?.(attempt + 1)
      const backoff = 20 * 2 ** attempt + Math.floor(deterministicJitter(attempt))
      await new Promise((r) => setTimeout(r, backoff))
    }
  }
}

// Math.random() is unavailable in some runtimes here; a tiny deterministic
// jitter (0–15ms, varies per attempt) is enough to desync retriers.
function deterministicJitter(attempt: number): number {
  return ((attempt * 7919) % 16)
}
