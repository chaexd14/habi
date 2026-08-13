import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { createApiClient } from "@/lib/supabase/api";

import { CreateScheduleItemSchema } from "@/lib/validations/schedule-item";
import { detectScheduleConflicts } from "@/lib/services/schedule-conflict";
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

    return NextResponse.json({
      success: true,
      data: scheduleItems,
    }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error?.message || "Failed to fetch schedule items",
    }, { status: 500 });
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

  // Conflict detection via service: fetch existing items for target schedule
  const { data: existingItems, error: existingError } = await supabase
    .from("schedule_items")
    .select("*")
    .eq("schedule_id", scheduleItem.schedule_id);

  if (existingError) {
    return NextResponse.json(
      { success: false, error: existingError.message },
      { status: 500 }
    );
  }

  if (existingItems && existingItems.length > 0) {
    const scheduleIds = [...new Set(existingItems.map((i: ScheduleItem) => i.schedule_id))];
    const { data: scheduleData } = await supabase
      .from("schedules")
      .select("id, title")
      .in("id", scheduleIds);

    const scheduleNameMap = new Map<string, string>();
    if (scheduleData) {
      for (const s of scheduleData) {
        scheduleNameMap.set(s.id, s.title);
      }
    }

    const conflicts = detectScheduleConflicts(
      scheduleItem,
      existingItems as ScheduleItem[],
      scheduleNameMap
    );

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

  // No conflicts — create the schedule item
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

  revalidateTag("schedules", "default");

  return NextResponse.json(
    {
      success: true,
      message: "Schedule item created successfully!",
      data,
    },
    { status: 201 }
  );
}