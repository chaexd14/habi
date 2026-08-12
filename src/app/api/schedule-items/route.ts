import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/api";

import { CreateScheduleItemSchema } from "@/lib/validations/schedule-item";

// GET /api/schedule-items
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

  const { data, error } = await supabase
    .from("schedule_items")
    .select("*");

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
        message: "No schedules found.",
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

// POST /api/schedule-items
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

  // Parse and validate request body
  const body = await request.json();

  const result = CreateScheduleItemSchema.safeParse(body);

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

  const scheduleItem = result.data;

  // Check if the exact schedule item already exists
  const { data: existingItem, error: existingItemError } = await supabase
    .from("schedule_items")
    .select("id")
    .eq("title", scheduleItem.title)
    .eq("start_time", scheduleItem.start_time)
    .eq("end_time", scheduleItem.end_time)
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
        error: "This schedule item already exists.",
      },
      { status: 409 }
    );
  }

  // Create schedule item
  const { data, error } = await supabase
    .from("schedule_items")
    .insert([scheduleItem])
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

  return NextResponse.json(
    {
      success: true,
      message: "Schedule item created successfully!",
      data,
    },
    { status: 201 }
  );
}