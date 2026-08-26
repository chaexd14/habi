import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { createApiClient } from "@/lib/supabase/api";

import { UpdateCalendarItemSchema } from "@/lib/validations/calendar-item";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
}


// GET /api/calendar-items/[id]
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

  const { data: calendarItem, error: calendarItemError } = await supabase
    .from("calendar_items")
    .select("*")
    .eq("id", id)
    .single();

  if (calendarItemError) {
    return NextResponse.json({
      success: false,
      error: calendarItemError.message
    }, { status: 500 })
  }

  if (!calendarItem) {
    return NextResponse.json({
      success: false,
      error: "Calendar item not found"
    }, { status: 404 })
  }

  return NextResponse.json({
    success: true,
    data: calendarItem,
  }, { status: 200 })
}

// PATCH /api/calendar-items/[id]
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

  const body = await request.json()

  const result = UpdateCalendarItemSchema.safeParse(body)

  if (!result.success) {
    return NextResponse.json({
      success: false,
      error: "Validation failed",
      details: result.error.flatten(),
    }, { status: 400 })
  }

  const { allow_conflict, ...updates } = result.data;

  // Update the calendar item
  const { data: calendarItem, error: updateError } = await supabase
    .from("calendar_items")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();


  if (updateError) {
    return NextResponse.json({
      success: false,
      error: updateError.message
    }, { status: 500 })
  }

  if (!calendarItem) {
    return NextResponse.json({
      success: false,
      error: "Calendar item not found"
    }, { status: 404 })
  }

  revalidateTag("schedules", "default");

  return NextResponse.json({
    success: true,
    message: "Calendar item updated successfully!",
    data: calendarItem,
  }, { status: 200 })
}

// DELETE /api/calendar-items/[id]
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

  // Delete the calendar item
  const { data: deletedCalendarItem, error: deleteError } = await supabase
    .from("calendar_items")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle()

  if (deleteError) {
    return NextResponse.json({
      success: false,
      error: deleteError.message
    }, { status: 500 })
  }

  if (!deletedCalendarItem) {
    return NextResponse.json({
      success: false,
      error: "Calendar item not found"
    }, { status: 404 })
  }

  revalidateTag("schedules", "default");

  return NextResponse.json({
    success: true,
    message: "Calendar item deleted successfully!",
    data: deletedCalendarItem,
  }, { status: 200 })
}
