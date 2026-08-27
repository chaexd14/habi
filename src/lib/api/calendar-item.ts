import { CalendarItemResponse } from "@/types/calendar-item";
import { CreateCalendarItemInput } from "@/lib/validations/calendar-item";
import createClient from "@/lib/supabase/client";
import { ScheduleConflictError } from "@/lib/api/schedule-item";
import type { ConflictDetail } from "@/lib/services/schedule-conflict";

let calendarItemPromise: Promise<CalendarItemResponse> | null = null;

export async function getCalendarItems(forceRefresh = false): Promise<CalendarItemResponse> {
  if (!forceRefresh && calendarItemPromise) {
    return calendarItemPromise;
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

      const url = `/api/calendar-items?t=${Date.now()}`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        cache: "no-store",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to fetch calendar items.");
      }

      const data: CalendarItemResponse = await response.json();
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
    if (response.status === 409 && resJson.conflicts) {
      throw new ScheduleConflictError(
        resJson.error || "Schedule conflict detected",
        resJson.conflicts as ConflictDetail[]
      );
    }
    throw new Error(resJson.error || "Failed to create calendar event.");
  }

  clearCalendarItemCache();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("habi:data-invalidated", { detail: { type: "calendar-items" } }));
  }
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
    if (response.status === 409 && resJson.conflicts) {
      throw new ScheduleConflictError(
        resJson.error || "Schedule conflict detected",
        resJson.conflicts as ConflictDetail[]
      );
    }
    throw new Error(resJson.error || "Failed to update calendar event.");
  }

  clearCalendarItemCache();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("habi:data-invalidated", { detail: { type: "calendar-items" } }));
  }
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
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("habi:data-invalidated", { detail: { type: "calendar-items" } }));
  }
  return resJson;
}

export function clearCalendarItemCache() {
  calendarItemPromise = null;
}
