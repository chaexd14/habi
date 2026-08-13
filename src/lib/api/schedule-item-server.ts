import { cacheLife, cacheTag } from "next/cache";
import { createApiClient } from "@/lib/supabase/api";
import { ScheduleItem } from "@/types/schedule";

/**
 * Server-side cached function to fetch user schedule items by user ID.
 * Employs Next.js 16 Cache Components ('use cache', cacheLife, cacheTag).
 */
export async function fetchScheduleItemsCached(userId: string, token: string): Promise<ScheduleItem[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("schedule-items", `schedule-items-${userId}`);

  const supabase = createApiClient(token);
  const { data, error } = await supabase
    .from("schedule_items")
    .select("*")
    .eq("user_id", userId)
    .order("start_time", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data as ScheduleItem[]) ?? [];
}
