import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { createApiClient } from "@/lib/supabase/api";

import { CreateCalendarItemSchema } from "@/lib/validations/calendar-item";
import { detectCalendarEventConflicts } from "@/lib/services/schedule-conflict";
import { ScheduleItem } from "@/types/schedule";

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

    return NextResponse.json(
      {
        success: true,
        data: calendarItems,
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
        error: error instanceof Error ? error.message : "Failed to fetch calendar items",
      },
      { status: 500 }
    );
  }
}

// POST /api/calendar-items
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

  const body = await request.json();

  const result = CreateCalendarItemSchema.safeParse(body);

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

  const { allow_conflict, ...calendarItemData } = result.data;

  // If allow_conflict is not explicitly true, perform conflict check
  if (!allow_conflict) {
    const [
      { data: userSchedules },
      { data: allUserScheduleItems },
      { data: allUserCalendarItems },
    ] = await Promise.all([
      supabase.from("schedules").select("*").eq("user_id", user.id),
      supabase
        .from("schedule_items")
        .select("*, schedules!inner(user_id)")
        .eq("schedules.user_id", user.id),
      supabase.from("calendar_items").select("*").eq("user_id", user.id),
    ]);

    const conflicts = detectCalendarEventConflicts({
      newEvent: calendarItemData,
      allSchedules: userSchedules || [],
      allScheduleItems: (allUserScheduleItems as unknown as ScheduleItem[]) || [],
      allCalendarItems: allUserCalendarItems || [],
    });

    if (conflicts.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Schedule conflict detected",
          conflicts,
        },
        { status: 409 }
      );
    }
  }

  // Create the calendar item (without allow_conflict property)
  const { data, error } = await supabase
    .from("calendar_items")
    .insert([{ ...calendarItemData, user_id: user.id }])
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

  revalidateTag("calendar-items", "default");
  revalidateTag(`calendar-items-${user.id}`, "default");

  return NextResponse.json(
    {
      success: true,
      message: "Calendar item created successfully!",
      data,
    },
    { status: 201 }
  );
}