import { cacheLife, cacheTag } from "next/cache";
import { createApiClient } from "@/lib/supabase/api";
import { CalendarItem } from "@/types/calendar-item";

/**
 * Server-side cached function to fetch user calendar items by user ID.
 * Employs Next.js 16 Cache Components ('use cache', cacheLife, cacheTag).
 */
export async function fetchCalendarItemsCached(userId: string, token: string): Promise<CalendarItem[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("calendar-items", `calendar-items-${userId}`);

  const supabase = createApiClient(token);
  const { data, error } = await supabase
    .from("calendar_items")
    .select("*")
    .eq("user_id", userId)
    .order("start_time", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data as CalendarItem[]) ?? [];
}
