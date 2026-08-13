import { ScheduleResponse } from "@/types/schedule";
import { CreateScheduleSchema } from "@/lib/validations/schedule";
import createClient from "@/lib/supabase/client";

const CACHE_KEY = "habi_schedules_cache";

let cachedScheduleResponse: ScheduleResponse | null = null;
let schedulePromise: Promise<ScheduleResponse> | null = null;

export async function getSchedules(forceRefresh = false): Promise<ScheduleResponse> {
  if (!forceRefresh) {
    if (cachedScheduleResponse) {
      return cachedScheduleResponse;
    }

    if (typeof window !== "undefined") {
      try {
        const stored = sessionStorage.getItem(CACHE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as ScheduleResponse;
          cachedScheduleResponse = parsed;
          return parsed;
        }
      } catch (e) {
        console.error("Failed to read schedules from sessionStorage:", e);
      }
    }

    if (schedulePromise) {
      return schedulePromise;
    }
  }

  schedulePromise = (async () => {
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        return {
          success: true,
          message: "User not logged in",
          data: [],
        };
      }

      const url = forceRefresh ? `/api/schedules?t=${Date.now()}` : "/api/schedules";
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        cache: forceRefresh ? "no-store" : "default",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to fetch schedules.");
      }

      const data: ScheduleResponse = await response.json();
      if (data.success) {
        cachedScheduleResponse = data;
        if (typeof window !== "undefined") {
          try {
            sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
          } catch (e) {
            console.error("Failed to save schedules to sessionStorage:", e);
          }
        }
      }
      return data;
    } finally {
      schedulePromise = null;
    }
  })();

  return schedulePromise;
}

export async function createScheduleApi(
  input: CreateScheduleSchema
): Promise<ScheduleResponse> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("You must be logged in to create a schedule.");
  }

  const response = await fetch("/api/schedules", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(input),
  });

  const resJson = await response.json();

  if (!response.ok || !resJson.success) {
    throw new Error(resJson.error || "Failed to create schedule.");
  }

  clearScheduleCache();
  return resJson;
}

export function clearScheduleCache() {
  cachedScheduleResponse = null;
  schedulePromise = null;
  if (typeof window !== "undefined") {
    try {
      sessionStorage.removeItem(CACHE_KEY);
    } catch (e) {
      // ignore
    }
  }
}
