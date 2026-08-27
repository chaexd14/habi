import { ScheduleItemResponse } from "@/types/schedule";
import { CreateScheduleItemInput } from "@/lib/validations/schedule-item";
import createClient from "@/lib/supabase/client";
import type { ConflictDetail } from "@/lib/services/schedule-conflict";

export type { ConflictDetail, ScheduleConflict } from "@/lib/services/schedule-conflict";

export class ScheduleConflictError extends Error {
  conflicts: ConflictDetail[];
  constructor(message: string, conflicts: ConflictDetail[]) {
    super(message);
    this.name = "ScheduleConflictError";
    this.conflicts = conflicts;
  }
}

let scheduleItemPromise: Promise<ScheduleItemResponse> | null = null;

export async function getScheduleItems(forceRefresh = false): Promise<ScheduleItemResponse> {
  if (!forceRefresh && scheduleItemPromise) {
    return scheduleItemPromise;
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

      const url = `/api/schedule-items?t=${Date.now()}`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        cache: "no-store",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to fetch schedule items.");
      }

      const data: ScheduleItemResponse = await response.json();
      return data;
    } finally {
      scheduleItemPromise = null;
    }
  })();

  return scheduleItemPromise;
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
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("habi:data-invalidated", { detail: { type: "schedule-items" } }));
  }
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
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("habi:data-invalidated", { detail: { type: "schedule-items" } }));
  }
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
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("habi:data-invalidated", { detail: { type: "schedule-items" } }));
  }
  return resJson;
}

export function clearScheduleItemCache() {
  scheduleItemPromise = null;
}
