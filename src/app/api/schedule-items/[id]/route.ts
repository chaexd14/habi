import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { createApiClient } from "@/lib/supabase/api";

import { UpdateScheduleItemSchema } from "@/lib/validations/schedule-item";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/schedule-items/[id]
export async function GET(request: NextRequest, { params }: RouteContext) {
  const authHeader = request.headers.get("Authorization")

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

  const { id } = await params;

  const { data: scheduleItem, error: scheduleItemError } = await supabase
    .from("schedule_items")
    .select("*")
    .eq("id", id)
    .single();

  if (scheduleItemError) {
    return NextResponse.json(
      {
        success: false,
        error: scheduleItemError.message,
      },
      { status: 500 }
    );
  }

  if (!scheduleItem) {
    return NextResponse.json(
      {
        success: false,
        error: "Schedule item not found",
      },
      { status: 404 }
    );
  }

  return NextResponse.json(
    {
      success: true,
      data: scheduleItem,
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    }
  );
}

// PATCH /api/schedule-items/[id]
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const authHeader = request.headers.get("Authorization")

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

  const { data: { user } } = await supabase.auth.getUser();

  // Parse and validate request body
  const body = await request.json();

  const result = UpdateScheduleItemSchema.safeParse(body);

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

  const { allow_conflict: _allow_conflict, ...updates } = result.data;

  // Update schedule item
  const { data: scheduleItem, error: updateError } = await supabase
    .from("schedule_items")
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

  if (!scheduleItem) {
    return NextResponse.json(
      {
        success: false,
        error: "Schedule item not found",
      },
      { status: 404 }
    );
  }

  revalidateTag("schedule-items", "default");
  revalidateTag("schedules", "default");
  if (user) {
    revalidateTag(`schedule-items-${user.id}`, "default");
    revalidateTag(`schedules-${user.id}`, "default");
  }

  return NextResponse.json(
    {
      success: true,
      message: "Schedule item updated successfully!",
      data: scheduleItem,
    },
    { status: 200 }
  );
}

// DELETE /api/schedule-items/[id]
export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const authHeader = request.headers.get("Authorization")

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

  const { data: { user } } = await supabase.auth.getUser();

  // Delete schedule item
  const { data: deletedScheduleItem, error: deleteError } = await supabase
    .from("schedule_items")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (deleteError) {
    return NextResponse.json(
      {
        success: false,
        error: deleteError.message,
      },
      { status: 500 }
    );
  }

  if (!deletedScheduleItem) {
    return NextResponse.json(
      {
        success: false,
        error: "Schedule item not found or you do not have permission to delete it.",
      },
      { status: 404 }
    );
  }

  revalidateTag("schedule-items", "default");
  revalidateTag("schedules", "default");
  if (user) {
    revalidateTag(`schedule-items-${user.id}`, "default");
    revalidateTag(`schedules-${user.id}`, "default");
  }

  return NextResponse.json(
    {
      success: true,
      message: "Schedule item deleted successfully!",
    },
    { status: 200 }
  );
}
