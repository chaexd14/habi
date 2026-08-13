import { CalendarItemResponse } from "@/types/calendar-item";
import { CreateCalendarItemInput } from "@/lib/validations/calendar-item";
import createClient from "@/lib/supabase/client";

const CACHE_KEY = "habi_calendar_items_cache";

let cachedCalendarItemResponse: CalendarItemResponse | null = null;
let calendarItemPromise: Promise<CalendarItemResponse> | null = null;

export async function getCalendarItems(forceRefresh = false): Promise<CalendarItemResponse> {
  if (!forceRefresh) {
    if (cachedCalendarItemResponse) {
      return cachedCalendarItemResponse;
    }

    if (typeof window !== "undefined") {
      try {
        const stored = sessionStorage.getItem(CACHE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as CalendarItemResponse;
          cachedCalendarItemResponse = parsed;
          return parsed;
        }
      } catch (e) {
        console.error("Failed to read calendar items from sessionStorage:", e);
      }
    }

    if (calendarItemPromise) {
      return calendarItemPromise;
    }
  }

  calendarItemPromise = (async () => {
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

      const url = forceRefresh ? `/api/calendar-items?t=${Date.now()}` : "/api/calendar-items";
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        cache: forceRefresh ? "no-store" : "default",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to fetch calendar items.");
      }

      const data: CalendarItemResponse = await response.json();
      if (data.success) {
        cachedCalendarItemResponse = data;
        if (typeof window !== "undefined") {
          try {
            sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
          } catch (e) {
            console.error("Failed to save calendar items to sessionStorage:", e);
          }
        }
      }
      return data;
    } finally {
      calendarItemPromise = null;
    }
  })();

  return calendarItemPromise;
}

export async function createCalendarItemApi(
  input: CreateCalendarItemInput
): Promise<CalendarItemResponse> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("You must be logged in to create a calendar event.");
  }

  const response = await fetch("/api/calendar-items", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(input),
  });

  const resJson = await response.json();

  if (!response.ok || !resJson.success) {
    throw new Error(resJson.error || "Failed to create calendar event.");
  }

  clearCalendarItemCache();
  return resJson;
}

export async function updateCalendarItemApi(
  id: string,
  input: Partial<CreateCalendarItemInput>
): Promise<CalendarItemResponse> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("You must be logged in to update a calendar event.");
  }

  const response = await fetch(`/api/calendar-items/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(input),
  });

  const resJson = await response.json();

  if (!response.ok || !resJson.success) {
    throw new Error(resJson.error || "Failed to update calendar event.");
  }

  clearCalendarItemCache();
  return resJson;
}

export async function deleteCalendarItemApi(id: string): Promise<CalendarItemResponse> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("You must be logged in to delete a calendar event.");
  }

  const response = await fetch(`/api/calendar-items/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  const resJson = await response.json();

  if (!response.ok || !resJson.success) {
    throw new Error(resJson.error || "Failed to delete calendar event.");
  }

  clearCalendarItemCache();
  return resJson;
}

export function clearCalendarItemCache() {
  cachedCalendarItemResponse = null;
  calendarItemPromise = null;
  if (typeof window !== "undefined") {
    try {
      sessionStorage.removeItem(CACHE_KEY);
    } catch (e) {
      // ignore
    }
  }
}
