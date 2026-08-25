"use client";

import { useEffect, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import createClient from "@/lib/supabase/client";
import {
  SESSION_LOGOUT_EVENT_KEY,
  clearSessionRecord,
  getRemainingSessionMs,
  getSessionStartTime,
  isSessionExpired,
  recordSessionStart,
} from "@/lib/auth/session";

export function SessionTimeoutManager() {
  const router = useRouter();
  const pathname = usePathname();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isLoggingOutRef = useRef(false);

  const handleSessionExpired = useCallback(async () => {
    if (isLoggingOutRef.current) return;
    isLoggingOutRef.current = true;

    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      clearSessionRecord(true);

      if (typeof window !== "undefined") {
        sessionStorage.clear();
      }

      router.push("/auth/login?expired=1");
      router.refresh();
    } catch (error) {
      console.error("Error during session expiration signout:", error);
      router.push("/auth/login?expired=1");
    } finally {
      isLoggingOutRef.current = false;
    }
  }, [router]);

  const scheduleTimeout = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    const sessionStart = getSessionStartTime();
    if (!sessionStart) return;

    if (isSessionExpired(sessionStart)) {
      handleSessionExpired();
      return;
    }

    const remainingMs = getRemainingSessionMs(sessionStart);
    if (remainingMs <= 0) {
      handleSessionExpired();
      return;
    }

    // Schedule timer for remaining time until 8 hours elapse
    timerRef.current = setTimeout(() => {
      handleSessionExpired();
    }, remainingMs);
  }, [handleSessionExpired]);

  useEffect(() => {
    const supabase = createClient();

    // 1. Initial check on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        const sessionStart = getSessionStartTime();
        if (!sessionStart) {
          // If session exists in Supabase without timestamp, initialize it
          recordSessionStart(Date.now());
        }
        scheduleTimeout();
      }
    });

    // 2. Auth state subscription
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        const sessionStart = getSessionStartTime();
        if (!sessionStart) {
          recordSessionStart(Date.now());
        }
        scheduleTimeout();
      } else if (event === "SIGNED_OUT") {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
      }
    });

    // 3. Tab visibility / device resume handling
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === "visible") {
        const sessionStart = getSessionStartTime();
        if (sessionStart) {
          if (isSessionExpired(sessionStart)) {
            handleSessionExpired();
          } else {
            // Re-align timer in case system clock or device sleep shifted timeouts
            scheduleTimeout();
          }
        }
      }
    };

    // 4. Multi-tab synchronization
    const handleStorage = (event: StorageEvent) => {
      if (event.key === SESSION_LOGOUT_EVENT_KEY) {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
        if (pathname && !pathname.startsWith("/auth")) {
          router.push("/auth/login?expired=1");
          router.refresh();
        }
      }
    };

    window.addEventListener("visibilitychange", handleVisibilityOrFocus);
    window.addEventListener("focus", handleVisibilityOrFocus);
    window.addEventListener("storage", handleStorage);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      subscription.unsubscribe();
      window.removeEventListener("visibilitychange", handleVisibilityOrFocus);
      window.removeEventListener("focus", handleVisibilityOrFocus);
      window.removeEventListener("storage", handleStorage);
    };
  }, [scheduleTimeout, handleSessionExpired, pathname, router]);

  return null;
}
export default SessionTimeoutManager;
