/**
 * Retry classification and backoff for integration jobs.
 * Validation/permanent errors must NOT be retried indefinitely.
 */

export type ErrorClass = "retryable" | "permanent";

export class PermanentError extends Error {
  readonly errorClass: ErrorClass = "permanent";
}
export class RetryableError extends Error {
  readonly errorClass: ErrorClass = "retryable";
}

export function classifyError(err: unknown): ErrorClass {
  if (err instanceof PermanentError) return "permanent";
  if (err instanceof RetryableError) return "retryable";
  // Heuristic for HTTP-ish errors: 4xx (except 408/429) are permanent.
  const status = (err as { status?: number })?.status;
  if (typeof status === "number") {
    if (status === 408 || status === 429) return "retryable";
    if (status >= 400 && status < 500) return "permanent";
    if (status >= 500) return "retryable";
  }
  // Unknown/transport errors are treated as retryable within the max-attempt cap.
  return "retryable";
}

/** Exponential backoff with full jitter, capped. Returns milliseconds. */
export function backoffMs(attempt: number, baseMs = 1000, capMs = 60_000): number {
  const exp = Math.min(capMs, baseMs * 2 ** Math.max(0, attempt - 1));
  return Math.floor(Math.random() * exp);
}
