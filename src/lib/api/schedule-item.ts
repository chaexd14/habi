import { ScheduleItemResponse } from "@/types/schedule";
import { CreateScheduleItemInput } from "@/lib/validations/schedule-item";
import createClient from "@/lib/supabase/client";

const CACHE_KEY = "habi_schedule_items_cache";

let cachedScheduleItemResponse: ScheduleItemResponse | null = null;
let scheduleItemPromise: Promise<ScheduleItemResponse> | null = null;

export async function getScheduleItems(forceRefresh = false): Promise<ScheduleItemResponse> {
  if (!forceRefresh) {
    if (cachedScheduleItemResponse) {
      return cachedScheduleItemResponse;
    }

    if (typeof window !== "undefined") {
      try {
        const stored = sessionStorage.getItem(CACHE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as ScheduleItemResponse;
          cachedScheduleItemResponse = parsed;
          return parsed;
        }
      } catch (e) {
        console.error("Failed to read schedule items from sessionStorage:", e);
      }
    }

    if (scheduleItemPromise) {
      return scheduleItemPromise;
    }
  }

  scheduleItemPromise = (async () => {
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

      const url = forceRefresh ? `/api/schedule-items?t=${Date.now()}` : "/api/schedule-items";
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        cache: forceRefresh ? "no-store" : "default",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to fetch schedule items.");
      }

      const data: ScheduleItemResponse = await response.json();
      if (data.success) {
        cachedScheduleItemResponse = data;
        if (typeof window !== "undefined") {
          try {
            sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
          } catch (e) {
            console.error("Failed to save schedule items to sessionStorage:", e);
          }
        }
      }
      return data;
    } finally {
      scheduleItemPromise = null;
    }
  })();

  return scheduleItemPromise;
}

// Re-export conflict types from the service for consumer convenience
export type { ConflictDetail, ScheduleConflict } from "@/lib/services/schedule-conflict";

import type { ConflictDetail } from "@/lib/services/schedule-conflict";

export class ScheduleConflictError extends Error {
  conflicts: ConflictDetail[];
  constructor(message: string, conflicts: ConflictDetail[]) {
    super(message);
    this.name = "ScheduleConflictError";
    this.conflicts = conflicts;
  }
}

export async function createScheduleItemApi(
  input: CreateScheduleItemInput
): Promise<ScheduleItemResponse> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("You must be logged in to create a schedule item.");
  }

  const response = await fetch("/api/schedule-items", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(input),
  });

  const resJson = await response.json();

  if (!response.ok || !resJson.success) {
    // Surface conflict data as a typed error
    if (response.status === 409 && resJson.conflicts) {
      throw new ScheduleConflictError(
        resJson.error || "Schedule conflict detected",
        resJson.conflicts as ConflictDetail[]
      );
    }

    let errorMsg = resJson.error || "Failed to create schedule item.";
    if (resJson.details?.fieldErrors) {
      const fieldMsgs = Object.entries(resJson.details.fieldErrors)
        .map(([field, msgs]) => `${field}: ${(msgs as string[]).join(", ")}`)
        .join("; ");
      if (fieldMsgs) {
        errorMsg += ` (${fieldMsgs})`;
      }
    }
    throw new Error(errorMsg);
  }

  clearScheduleItemCache();
  return resJson;
}


export async function updateScheduleItemApi(
  id: string,
  input: Partial<CreateScheduleItemInput>
): Promise<ScheduleItemResponse> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("You must be logged in to update a schedule item.");
  }

  const response = await fetch(`/api/schedule-items/${id}`, {
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

    let errorMsg = resJson.error || "Failed to update schedule item.";
    if (resJson.details?.fieldErrors) {
      const fieldMsgs = Object.entries(resJson.details.fieldErrors)
        .map(([field, msgs]) => `${field}: ${(msgs as string[]).join(", ")}`)
        .join("; ");
      if (fieldMsgs) {
        errorMsg += ` (${fieldMsgs})`;
      }
    }
    throw new Error(errorMsg);
  }


  clearScheduleItemCache();
  return resJson;
}

export async function deleteScheduleItemApi(id: string): Promise<ScheduleItemResponse> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("You must be logged in to delete a schedule item.");
  }

  const response = await fetch(`/api/schedule-items/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  const resJson = await response.json();

  if (!response.ok || !resJson.success) {
    throw new Error(resJson.error || "Failed to delete schedule item.");
  }

  clearScheduleItemCache();
  return resJson;
}

export function clearScheduleItemCache() {
  cachedScheduleItemResponse = null;
  scheduleItemPromise = null;
  if (typeof window !== "undefined") {
    try {
      sessionStorage.removeItem(CACHE_KEY);
    } catch (e) {
      // ignore
    }
  }
}
