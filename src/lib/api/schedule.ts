import { ScheduleResponse } from "@/types/schedule";
import { CreateScheduleSchema, UpdateScheduleSchema } from "@/lib/validations/schedule";
import createClient from "@/lib/supabase/client";

let schedulePromise: Promise<ScheduleResponse> | null = null;

export async function getSchedules(forceRefresh = false): Promise<ScheduleResponse> {
  if (!forceRefresh && schedulePromise) {
    return schedulePromise;
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

      const url = `/api/schedules?t=${Date.now()}`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        cache: "no-store",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to fetch schedules.");
      }

      const data: ScheduleResponse = await response.json();
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
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("habi:data-invalidated", { detail: { type: "schedules" } }));
  }
  return resJson;
}

export async function updateScheduleApi(
  id: string,
  input: UpdateScheduleSchema
): Promise<ScheduleResponse> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("You must be logged in to update a schedule.");
  }

  const response = await fetch(`/api/schedules/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(input),
  });

  const resJson = await response.json();

  if (!response.ok || !resJson.success) {
    throw new Error(resJson.error || "Failed to update schedule.");
  }

  clearScheduleCache();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("habi:data-invalidated", { detail: { type: "schedules" } }));
  }
  return resJson;
}

export async function deleteScheduleApi(id: string): Promise<ScheduleResponse> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("You must be logged in to delete a schedule.");
  }

  const response = await fetch(`/api/schedules/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  const resJson = await response.json();

  if (!response.ok || !resJson.success) {
    throw new Error(resJson.error || "Failed to delete schedule.");
  }

  clearScheduleCache();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("habi:data-invalidated", { detail: { type: "schedules" } }));
  }
  return resJson;
}

export function clearScheduleCache() {
  schedulePromise = null;
}
