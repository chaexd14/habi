import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/api";

import { CreateCalendarItemSchema } from "@/lib/validations/calendar-item";

// GET /api/calendar-items
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

  const { data: calendarItems, error } = await supabase
    .from("calendar_items")
    .select("*");

  if (error) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }

  // Check if no calendar items are retrieved
  if (!calendarItems || calendarItems.length === 0) {
    return NextResponse.json({
      success: true,
      message: "No calendar events found",
      data: []
    }, { status: 200 })
  }

  // Return the calendar items
  return NextResponse.json({
    success: true,
    data: calendarItems,
  }, { status: 200 })
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

  return NextResponse.json({
    success: true,
    message: "Calendar item created successfully!",
    data,
  }, { status: 201 })
}