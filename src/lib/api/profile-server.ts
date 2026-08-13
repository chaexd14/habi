import { cacheLife, cacheTag } from "next/cache";
import { createApiClient } from "@/lib/supabase/api";
import { UserProfile } from "@/types/profile";

/**
 * Server-side cached function to fetch user profile by user ID.
 * Employs Next.js 16 Cache Components ('use cache', cacheLife, cacheTag).
 */
export async function fetchUserProfileCached(userId: string, token: string): Promise<UserProfile[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("user-profiles", `user-profile-${userId}`);

  const supabase = createApiClient(token);
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId);

  if (error) {
    throw new Error(error.message);
  }

  return (data as UserProfile[]) ?? [];
}
