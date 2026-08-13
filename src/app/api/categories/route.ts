import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { createApiClient } from "@/lib/supabase/api";

import { CreateCategorySchema } from "@/lib/validations/category";

// GET /api/categories
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("Authorization")

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({
      success: false,
      error: "Unauthorized"
    }, { status: 401 })
  }

  const token = authHeader.substring(7)
  const supabase = createApiClient(token)

  const { data, error } = await supabase.from("categories").select("*")

  // Check for error
  if (error) {
    return NextResponse.json(
      {
        success: false,
        error: error.message
      }, { status: 500 }
    )
  }

  // Check if no data is found
  if (!data || data.length === 0) {
    return NextResponse.json(
      {
        success: true,
        message: "No categories found.",
        data: [],
      },
      { status: 200 }
    );
  }

  // Return the data
  return NextResponse.json({
    success: true,
    data,
  }, { status: 200 })
}

// POST /api/categories
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("Authorization")

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({
      success: false,
      error: "Unauthorized"
    }, { status: 401 })
  }

  const token = authHeader.substring(7)
  const supabase = createApiClient(token)

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

  const categories = result.data;

  // Check if the category already exists
  const { data: existingItem, error: existingItemError } = await supabase
    .from("categories")
    .select("id")
    .eq("name", categories.name)
    .maybeSingle();

  if (existingItemError) {
    return NextResponse.json(
      {
        success: false,
        error: existingItemError.message
      },
      { status: 500 }
    );
  }

  if (existingItem) {
    return NextResponse.json(
      {
        success: false,
        error: "Category already exists"
      },
      { status: 409 }
    );
  }

  // Create the new category
  const { data, error } = await supabase
    .from("categories")
    .insert([categories])
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      {
        success: false,
        error: error.message
      },
      { status: 500 }
    );
  }

  revalidateTag("categories", "default");

  // Return the new category
  return NextResponse.json(
    {
      success: true,
      message: "Category created successfully!",
      data,
    },
    { status: 201 }
  );
}