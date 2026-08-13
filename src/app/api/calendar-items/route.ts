import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { createApiClient } from "@/lib/supabase/api";

import { CreateCalendarItemSchema } from "@/lib/validations/calendar-item";

import { fetchCalendarItemsCached } from "@/lib/api/calendar-item-server";

// GET /api/calendar-items
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({
      success: false,
      error: "Unauthorized"
    }, { status: 401 });
  }

  const token = authHeader.substring(7);
  const supabase = createApiClient(token);

  // Authenticate user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error("Auth error:", userError);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to authenticate user.",
        details: userError?.message,
      },
      { status: 401 }
    );
  }

  try {
    const calendarItems = await fetchCalendarItemsCached(user.id, token);

    return NextResponse.json({
      success: true,
      data: calendarItems,
    }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error?.message || "Failed to fetch calendar items"
    }, { status: 500 });
  }
}

// POST /api/calendar-items
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

  // Get the authenticated user
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json(
      {
        success: false,
        error: "Unable to authenticate user."
      },
      { status: 401 }
    );
  }

  const body = await request.json()

  const result = CreateCalendarItemSchema.safeParse(body)

  if (!result.success) {
    return NextResponse.json({
      success: false,
      error: "Validation failed",
      details: result.error.flatten(),
    }, { status: 400 })
  }

  const calendarItem = result.data

  // Check if the calendar item already exists
  const { data: existingItem, error: existingItemError } = await supabase
    .from("calendar_items")
    .select("id")
    .eq("user_id", user.id)
    .eq("title", calendarItem.title)
    .maybeSingle();

  if (existingItemError) {
    return NextResponse.json({
      success: false,
      error: existingItemError.message
    }, { status: 500 })
  }

  if (existingItem) {
    return NextResponse.json({
      success: false,
      error: "This calendar item already exists."
    }, { status: 409 })
  }

  const { data, error } = await supabase
    .from("calendar_items")
    .insert([{ ...calendarItem, user_id: user.id }])
    .select()
    .single()

  if (error) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }

  revalidateTag("calendar-items", "default");

  return NextResponse.json({
    success: true,
    message: "Calendar item created successfully!",
    data,
  }, { status: 201 })
}