// Batch utilities — stubbed after migration to Gemini (p-limit / p-retry removed).
export type BatchOptions = { concurrency?: number; retries?: number };

export function isRateLimitError(_err: unknown): boolean {
  return false;
}

export async function batchProcess<T, R>(
  _items: T[],
  _fn: (item: T) => Promise<R>,
  _opts?: BatchOptions,
): Promise<R[]> {
  throw new Error("batchProcess is not available after migration to Gemini.");
}

export async function batchProcessWithSSE<T, R>(
  _items: T[],
  _fn: (item: T) => Promise<R>,
  _onProgress: (result: R, index: number) => void,
  _opts?: BatchOptions,
): Promise<R[]> {
  throw new Error("batchProcessWithSSE is not available after migration to Gemini.");
}
