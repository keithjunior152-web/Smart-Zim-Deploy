import { QueryClient, hydrate } from "@tanstack/react-query";
import { persistQueryClient } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";

const WEEK = 1000 * 60 * 60 * 24 * 7;
const LAST_USER_KEY = "smartzim-last-user";

/**
 * Query-key prefixes whose successful results are safe to persist for offline
 * reading. These are study/reference resources scoped to the signed-in user;
 * the persisted blob is always written under a per-user key (see persisterKey)
 * so it can never leak across accounts on a shared device.
 */
export const OFFLINE_SAFE_PREFIXES = [
  "/api/auth/me",
  "/api/anthropic/conversations",
  "/api/notes",
  "/api/papers",
  "/api/planner",
  "/api/exam-dates",
  "/api/weak-topics",
  "/api/exam-readiness",
  "/api/curricula",
  "/api/dashboard",
];

function isOfflineSafeKey(queryKey: unknown): boolean {
  const first = Array.isArray(queryKey) ? queryKey[0] : undefined;
  return (
    typeof first === "string" &&
    OFFLINE_SAFE_PREFIXES.some((p) => first.startsWith(p))
  );
}

function persisterKey(userId: string): string {
  return `smartzim-offline-${userId}`;
}

let current: { unsubscribe: () => void; userId: string } | null = null;

/**
 * Synchronously hydrate the query cache for the last signed-in user on this
 * device, before React renders. This lets the auth gate (useGetCurrentUser)
 * resolve from cache while offline so saved study content is reachable.
 * Reads the same JSON blob that persistQueryClient writes.
 */
export function restoreCacheForLastUser(queryClient: QueryClient): void {
  if (typeof window === "undefined") return;
  const lastUserId = window.localStorage.getItem(LAST_USER_KEY);
  if (!lastUserId) return;
  const raw = window.localStorage.getItem(persisterKey(lastUserId));
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw) as {
      timestamp?: number;
      clientState?: unknown;
    };
    if (!parsed.clientState) return;
    if (parsed.timestamp && Date.now() - parsed.timestamp > WEEK) return;
    hydrate(queryClient, parsed.clientState);
  } catch {
    // Corrupt cache — ignore and start fresh.
  }
}

/**
 * Begin persisting offline-safe queries under the given user's key, and record
 * them as the last user so a later offline cold-start can restore. Idempotent
 * for the same user; re-keys (and stops the previous subscription) when the
 * signed-in user changes.
 */
export function setupOfflinePersistence(
  queryClient: QueryClient,
  userId: string,
): void {
  if (typeof window === "undefined") return;
  if (current?.userId === userId) return;
  current?.unsubscribe();
  const persister = createSyncStoragePersister({
    storage: window.localStorage,
    key: persisterKey(userId),
  });
  const [unsubscribe] = persistQueryClient({
    queryClient,
    persister,
    maxAge: WEEK,
    dehydrateOptions: {
      shouldDehydrateQuery: (query) =>
        query.state.status === "success" && isOfflineSafeKey(query.queryKey),
    },
  });
  current = { unsubscribe, userId };
  window.localStorage.setItem(LAST_USER_KEY, userId);
}

/**
 * Stop persisting and remove the per-user offline query cache. Call on logout
 * to ensure no account's cached content survives for the next user.
 */
export function purgeOfflinePersistence(userId?: string): void {
  if (typeof window === "undefined") return;
  current?.unsubscribe();
  current = null;
  const id = userId ?? window.localStorage.getItem(LAST_USER_KEY);
  if (id) window.localStorage.removeItem(persisterKey(id));
  window.localStorage.removeItem(LAST_USER_KEY);
}
