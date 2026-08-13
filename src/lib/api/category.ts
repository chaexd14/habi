import { CategoryResponse } from "@/types/category";
import { CreateCategorySchema } from "@/lib/validations/category";
import createClient from "@/lib/supabase/client";

const CACHE_KEY = "habi_categories_cache";

let cachedCategoryResponse: CategoryResponse | null = null;
let categoryPromise: Promise<CategoryResponse> | null = null;

export async function getCategories(forceRefresh = false): Promise<CategoryResponse> {
  if (!forceRefresh) {
    if (cachedCategoryResponse) {
      return cachedCategoryResponse;
    }

    if (typeof window !== "undefined") {
      try {
        const stored = sessionStorage.getItem(CACHE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as CategoryResponse;
          cachedCategoryResponse = parsed;
          return parsed;
        }
      } catch (e) {
        console.error("Failed to read categories from sessionStorage:", e);
      }
    }

    if (categoryPromise) {
      return categoryPromise;
    }
  }

  categoryPromise = (async () => {
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

      const url = forceRefresh ? `/api/categories?t=${Date.now()}` : "/api/categories";
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        cache: forceRefresh ? "no-store" : "default",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to fetch categories.");
      }

      const data: CategoryResponse = await response.json();
      if (data.success) {
        cachedCategoryResponse = data;
        if (typeof window !== "undefined") {
          try {
            sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
          } catch (e) {
            console.error("Failed to save categories to sessionStorage:", e);
          }
        }
      }
      return data;
    } finally {
      categoryPromise = null;
    }
  })();

  return categoryPromise;
}

export async function createCategoryApi(
  input: CreateCategorySchema
): Promise<CategoryResponse> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("You must be signed in to create a category.");
  }

  const response = await fetch("/api/categories", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(input),
  });

  const resJson = await response.json();

  if (!response.ok || !resJson.success) {
    throw new Error(resJson.error || "Failed to create category.");
  }

  clearCategoryCache();
  return resJson;
}

export function clearCategoryCache() {
  cachedCategoryResponse = null;
  categoryPromise = null;
  if (typeof window !== "undefined") {
    try {
      sessionStorage.removeItem(CACHE_KEY);
    } catch (e) {
      // ignore
    }
  }
}
