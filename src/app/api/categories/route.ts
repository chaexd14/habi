import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { createApiClient } from "@/lib/supabase/api";
import { fetchCategoriesCached } from "@/lib/api/category-server";
import { CreateCategorySchema } from "@/lib/validations/category";

// GET /api/categories
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json(
      {
        success: false,
        error: "Unauthorized",
      },
      { status: 401 }
    );
  }

  const token = authHeader.substring(7);
  const supabase = createApiClient(token);

  // Authenticate user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json(
      {
        success: false,
        error: "Unable to authenticate user.",
      },
      { status: 401 }
    );
  }

  try {
    const data = await fetchCategoriesCached(user.id, token);

    return NextResponse.json(
      {
        success: true,
        data,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch categories.",
      },
      { status: 500 }
    );
  }
}

// POST /api/categories
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json(
      {
        success: false,
        error: "Unauthorized",
      },
      { status: 401 }
    );
  }

  const token = authHeader.substring(7);
  const supabase = createApiClient(token);

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json(
      {
        success: false,
        error: "Unable to authenticate user.",
      },
      { status: 401 }
    );
  }

  // Parse and validate request body
  const body = await request.json();
  const result = CreateCategorySchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      {
        success: false,
        error: "Validation failed",
        details: result.error.flatten(),
      },
      { status: 400 }
    );
  }

  const category = result.data;

  // Check if category already exists for user
  const { data: existingItem, error: existingItemError } = await supabase
    .from("categories")
    .select("id")
    .eq("name", category.name)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingItemError) {
    return NextResponse.json(
      {
        success: false,
        error: existingItemError.message,
      },
      { status: 500 }
    );
  }

  if (existingItem) {
    return NextResponse.json(
      {
        success: false,
        error: "Category already exists",
      },
      { status: 409 }
    );
  }

  // Create the new category with user_id
  const { data, error } = await supabase
    .from("categories")
    .insert([{ ...category, user_id: user.id }])
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }

  revalidateTag("categories", "default");
  revalidateTag(`categories-${user.id}`, "default");

  return NextResponse.json(
    {
      success: true,
      message: "Category created successfully!",
      data,
    },
    { status: 201 }
  );
}