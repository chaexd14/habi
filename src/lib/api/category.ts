import { CategoryResponse } from "@/types/category";
import { CreateCategorySchema, UpdateCategorySchema } from "@/lib/validations/category";
import createClient from "@/lib/supabase/client";

let categoryPromise: Promise<CategoryResponse> | null = null;

export async function getCategories(forceRefresh = false): Promise<CategoryResponse> {
  if (!forceRefresh && categoryPromise) {
    return categoryPromise;
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

      const url = `/api/categories?t=${Date.now()}`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        cache: "no-store",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to fetch categories.");
      }

      const data: CategoryResponse = await response.json();
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
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("habi:data-invalidated", { detail: { type: "categories" } }));
  }
  return resJson;
}

export async function updateCategoryApi(
  id: string,
  input: UpdateCategorySchema
): Promise<CategoryResponse> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("You must be signed in to update a category.");
  }

  const response = await fetch(`/api/categories/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(input),
  });

  const resJson = await response.json();

  if (!response.ok || !resJson.success) {
    throw new Error(resJson.error || "Failed to update category.");
  }

  clearCategoryCache();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("habi:data-invalidated", { detail: { type: "categories" } }));
  }
  return resJson;
}

export async function deleteCategoryApi(id: string): Promise<CategoryResponse> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("You must be signed in to delete a category.");
  }

  const response = await fetch(`/api/categories/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  const resJson = await response.json();

  if (!response.ok || !resJson.success) {
    throw new Error(resJson.error || "Failed to delete category.");
  }

  clearCategoryCache();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("habi:data-invalidated", { detail: { type: "categories" } }));
  }
  return resJson;
}

export function clearCategoryCache() {
  categoryPromise = null;
}
