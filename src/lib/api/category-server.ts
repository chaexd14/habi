import { cacheLife, cacheTag } from "next/cache";
import { createApiClient } from "@/lib/supabase/api";
import { Category } from "@/types/category";

/**
 * Server-side cached function to fetch user categories by user ID.
 * Employs Next.js 16 Cache Components ('use cache', cacheLife, cacheTag).
 */
export async function fetchCategoriesCached(userId: string, token: string): Promise<Category[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("categories", `categories-${userId}`);

  const supabase = createApiClient(token);
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data as Category[]) ?? [];
}
