import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/api";

import { UpdateProfileInput } from "@/lib/validations/profile";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
}

// GET api/profiles/[id]
export async function GET(request: NextRequest, { params }: RouteContext) {
  const authHeader = request.headers.get("Authorization")

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({
      success: false,
      error: "Unauthorized"
    }, { status: 401 })
  }

  const token = authHeader.substring(7)

  const supabase = createApiClient(token);

  const { id } = await params

  const { data, error } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();

  if (error) {
    return NextResponse.json(
      {
        success: false,
        error: error.message
      }, { status: 500 }
    )
  }

  if (!data) {
    return NextResponse.json(
      {
        success: false,
        error: "Profile not found",
      },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    data,
  }, { status: 200 })
}

// PATCH api/profiles/[id]
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const authHeader = request.headers.get("Authorization")

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({
      success: false,
      error: "Unauthorized"
    }, { status: 401 })
  }
  const token = authHeader.substring(7)

  const supabase = createApiClient(token);

  const { id } = await params
  const body: UpdateProfileInput = await request.json()

  const { data, error } = await supabase.from("profiles").update(body).eq("id", id).select("*").single();

  if (error) {
    return NextResponse.json(
      {
        success: false,
        error: error.message
      }, { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    message: "Profile updated successfully",
    data,
  }, { status: 200 })
}