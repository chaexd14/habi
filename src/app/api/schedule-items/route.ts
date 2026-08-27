import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { createApiClient } from "@/lib/supabase/api";

import { CreateScheduleItemSchema } from "@/lib/validations/schedule-item";
import { detectRoutineConflicts } from "@/lib/services/schedule-conflict";
import { ScheduleItem } from "@/types/schedule";


import { fetchScheduleItemsCached } from "@/lib/api/schedule-item-server";

// GET /api/schedule-items
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
    const scheduleItems = await fetchScheduleItemsCached(user.id, token);

    return NextResponse.json(
      {
        success: true,
        data: scheduleItems,
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
        error: error instanceof Error ? error.message : "Failed to fetch schedule items",
      },
      { status: 500 }
    );
  }
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

  const { allow_conflict, ...scheduleItemData } = result.data;

  // If allow_conflict is not explicitly true, perform conflict check
  if (!allow_conflict) {
    // Fetch all user schedules, schedule items, and calendar items
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

    const targetSchedule = userSchedules?.find((s) => s.id === scheduleItemData.schedule_id);

    const conflicts = detectRoutineConflicts({
      newItem: scheduleItemData,
      targetSchedule,
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

  // Create the schedule item (without allow_conflict property)
  const { data, error } = await supabase
    .from("schedule_items")
    .insert([scheduleItemData])
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

  revalidateTag("schedule-items", "default");
  revalidateTag(`schedule-items-${user.id}`, "default");
  revalidateTag("schedules", "default");
  revalidateTag(`schedules-${user.id}`, "default");

  return NextResponse.json(
    {
      success: true,
      message: "Schedule item created successfully!",
      data,
    },
    { status: 201 }
  );

}