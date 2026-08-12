import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/api";

import { UpdateScheduleSchema } from "@/lib/validations/schedule";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/schedules/[id]
export async function GET(request: NextRequest, { params }: RouteContext) {
  const authHeader = request.headers.get("Authorization")

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({
      success: false,
      error: "Unauthorized"
    }, { status: 401 })
  }

  const token = authHeader.substring(7)
  const supabase = createApiClient(token)

  const { id } = await params

  const { data: schedule, error: scheduleError } = await supabase
    .from("schedules")
    .select(`*,schedule_items (*)`)
    .eq("id", id)
    .single();

  if (scheduleError) {
    return NextResponse.json({
      success: false,
      error: scheduleError.message
    }, { status: 500 })
  }

  if (!schedule) {
    return NextResponse.json({
      success: false,
      error: "No schedules found",
    }, { status: 404 })
  }

  return NextResponse.json({
    success: true,
    data: schedule,
  }, { status: 200 })
}

// PATCH /api/schedules/[id]
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { id } = await params
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

  const result = UpdateScheduleSchema.safeParse(body);

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

  // Update the schedule
  const { data: schedule, error: updateError } = await supabase
    .from("schedules")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();

  if (updateError) {
    return NextResponse.json(
      {
        success: false,
        error: updateError.message
      },
      { status: 500 }
    );
  }

  if (!schedule) {
    return NextResponse.json(
      {
        success: false,
        error: "Schedule not found"
      },
      { status: 404 }
    );
  }

  return NextResponse.json(
    {
      success: true,
      message: "Schedule updated successfully!",
      data: schedule,
    },
    { status: 200 }
  );
}

// DELETE /api/schedules/[id]
export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const { id } = await params
  const authHeader = request.headers.get("Authorization")

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({
      success: false,
      error: "Unauthorized"
    }, { status: 401 })
  }

  const token = authHeader.substring(7)
  const supabase = createApiClient(token)

  // Delete the schedule
  const { data: deletedSchedule, error: deleteError } = await supabase
    .from("schedules")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (deleteError) {
    return NextResponse.json(
      {
        success: false,
        error: deleteError.message
      },
      { status: 500 }
    );
  }

  if (!deletedSchedule) {
    return NextResponse.json(
      {
        success: false,
        error: "Schedule not found or you do not have permission to delete it.",
      },
      { status: 404 }
    );
  }

  return NextResponse.json(
    {
      success: true,
      message: "Schedule deleted successfully!",
      data: deletedSchedule,
    },
    { status: 200 }
  );
}