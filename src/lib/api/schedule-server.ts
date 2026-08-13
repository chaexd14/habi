import { cacheLife, cacheTag } from "next/cache";
import { createApiClient } from "@/lib/supabase/api";
import { Schedule } from "@/types/schedule";

/**
 * Server-side cached function to fetch user schedules by user ID.
 * Employs Next.js 16 Cache Components ('use cache', cacheLife, cacheTag).
 */
export async function fetchSchedulesCached(userId: string, token: string): Promise<Schedule[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("schedules", `schedules-${userId}`);

  const supabase = createApiClient(token);
  const { data, error } = await supabase
    .from("schedules")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data as Schedule[]) ?? [];
}
