import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { createApiClient } from "@/lib/supabase/api";

import { CreateScheduleSchema } from "@/lib/validations/schedule";

import { fetchSchedulesCached } from "@/lib/api/schedule-server";

// GET /api/schedules
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
    const schedules = await fetchSchedulesCached(user.id, token);

    return NextResponse.json(
      {
        success: true,
        data: schedules,
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to fetch schedules.",
      },
      { status: 500 }
    );
  }
}

// POST api/schedules
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

  // Parse and validate request body
  const body = await request.json();

  const result = CreateScheduleSchema.safeParse(body);

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

  const schedule = result.data;

  // Check if the schedule already existed
  const { data: existingItem, error: existingItemError } = await supabase
    .from("schedules")
    .select("id")
    .eq("user_id", user.id)
    .eq("title", schedule.title)
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

  // If the schedule already exists
  if (existingItem) {
    return NextResponse.json(
      {
        success: false,
        error: "This schedule already exists."
      },
      { status: 409 }
    )
  }

  // Create the new schedule with user_id
  const { data, error } = await supabase
    .from("schedules")
    .insert([{ ...schedule, user_id: user.id }])
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

  revalidateTag("schedules", "default");

  // Return the new schedule
  return NextResponse.json(
    {
      success: true,
      message: "Schedule created successfully!",
      data,
    },
    { status: 201 }
  );
}
