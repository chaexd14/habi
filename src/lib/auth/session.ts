export const SESSION_MAX_AGE_SECONDS = 8 * 60 * 60; // 8 hours in seconds (28,800)
export const SESSION_MAX_AGE_MS = SESSION_MAX_AGE_SECONDS * 1000; // 28,800,000 ms
export const SESSION_COOKIE_NAME = "habi_session_start";
export const SESSION_LOGOUT_EVENT_KEY = "habi_session_logout_sync";

/**
 * Record the start of a user session in both a cookie (for server proxy) and localStorage.
 */
export function recordSessionStart(timestamp: number = Date.now()): void {
  if (typeof window === "undefined") return;

  try {
    // 1. Set cookie accessible by Next.js Proxy/SSR
    document.cookie = `${SESSION_COOKIE_NAME}=${timestamp}; path=/; max-age=${SESSION_MAX_AGE_SECONDS}; SameSite=Lax`;

    // 2. Set localStorage for client-side timing & multi-tab persistence
    localStorage.setItem(SESSION_COOKIE_NAME, timestamp.toString());
  } catch (error) {
    console.error("Failed to record session start:", error);
  }
}

/**
 * Retrieve the timestamp when the current session was started.
 */
export function getSessionStartTime(): number | null {
  if (typeof window === "undefined") return null;

  try {
    // Try localStorage first
    const stored = localStorage.getItem(SESSION_COOKIE_NAME);
    if (stored) {
      const parsed = parseInt(stored, 10);
      if (!isNaN(parsed) && parsed > 0) {
        return parsed;
      }
    }

    // Fallback: parse document.cookie
    const match = document.cookie
      .split("; ")
      .find((row) => row.startsWith(`${SESSION_COOKIE_NAME}=`));

    if (match) {
      const value = match.split("=")[1];
      const parsed = parseInt(value, 10);
      if (!isNaN(parsed) && parsed > 0) {
        return parsed;
      }
    }
  } catch (error) {
    console.error("Failed to read session start time:", error);
  }

  return null;
}

/**
 * Check whether the 8-hour session duration has expired.
 */
export function isSessionExpired(startTime: number | null = getSessionStartTime()): boolean {
  if (!startTime) return false;
  return Date.now() - startTime >= SESSION_MAX_AGE_MS;
}

/**
 * Calculate the remaining milliseconds before the 8-hour session expires.
 * Returns 0 if already expired or if no active session timestamp is recorded.
 */
export function getRemainingSessionMs(startTime: number | null = getSessionStartTime()): number {
  if (!startTime) return 0;
  const elapsed = Date.now() - startTime;
  const remaining = SESSION_MAX_AGE_MS - elapsed;
  return remaining > 0 ? remaining : 0;
}

/**
 * Clear the session start record from cookies and local storage,
 * and broadcast a logout event to other open tabs.
 */
export function clearSessionRecord(broadcast = true): void {
  if (typeof window === "undefined") return;

  try {
    // Remove cookie
    document.cookie = `${SESSION_COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;

    // Remove local storage
    localStorage.removeItem(SESSION_COOKIE_NAME);

    // Broadcast logout event to synchronise across tabs
    if (broadcast) {
      localStorage.setItem(SESSION_LOGOUT_EVENT_KEY, Date.now().toString());
    }
  } catch (error) {
    console.error("Failed to clear session record:", error);
  }
}
