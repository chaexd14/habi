import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { createApiClient } from "@/lib/supabase/api";

import { UpdateCategorySchema } from "@/lib/validations/category";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

// GET /api/categories/[id]
export async function GET(request: NextRequest, context: RouteContext) {
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

  const { id } = await context.params;

  const { data: category, error: categoryError } = await supabase
    .from("categories")
    .select("*")
    .eq("id", id)
    .single();

  if (categoryError) {
    return NextResponse.json(
      {
        success: false,
        error: categoryError.message,
      },
      { status: 500 }
    );
  }

  if (!category) {
    return NextResponse.json(
      {
        success: false,
        error: "Category not found",
      },
      { status: 404 }
    );
  }

  return NextResponse.json(
    {
      success: true,
      data: category,
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    }
  );
}

// PATCH /api/categories/[id]
export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
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
  } = await supabase.auth.getUser();

  // Parse and validate request body
  const body = await request.json();

  const result = UpdateCategorySchema.safeParse(body);

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

  const updates = result.data;

  // Update the category
  const { data: category, error: updateError } = await supabase
    .from("categories")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();

  if (updateError) {
    return NextResponse.json(
      {
        success: false,
        error: updateError.message,
      },
      { status: 500 }
    );
  }

  if (!category) {
    return NextResponse.json(
      {
        success: false,
        error: "Category not found",
      },
      { status: 404 }
    );
  }

  revalidateTag("categories", "default");
  if (user) {
    revalidateTag(`categories-${user.id}`, "default");
  }

  return NextResponse.json(
    {
      success: true,
      message: "Category updated successfully!",
      data: category,
    },
    { status: 200 }
  );
}

// DELETE /api/categories/[id]
export async function DELETE(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
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
  } = await supabase.auth.getUser();

  // Delete the category
  const { error } = await supabase
    .from("categories")
    .delete()
    .select("id")
    .eq("id", id)
    .maybeSingle();

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
  if (user) {
    revalidateTag(`categories-${user.id}`, "default");
  }

  return NextResponse.json(
    {
      success: true,
      message: "Category deleted successfully!",
    },
    { status: 200 }
  );
}
