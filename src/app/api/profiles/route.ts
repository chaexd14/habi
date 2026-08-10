import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/api";
import { CreateProfileInput } from "@/lib/validations/profile";

// GET api/profiles
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("Authorization")

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({
      success: false,
      error: "Unauthorized"
    }, { status: 401 })
  }

  const token = authHeader.substring(7)

  const supabase = createApiClient(token);

  const { data, error } = await supabase.from("profiles").select("*");

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
    data,
  }, { status: 200 })
}

// POST api/profiles
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("Authorization")

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({
      success: false,
      error: "Unauthorized"
    }, { status: 401 })
  }

  const token = authHeader.substring(7)

  const supabase = createApiClient(token);

  const body: CreateProfileInput = await request.json()

  const { data, error } = await supabase.from("profiles").insert([body]);

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
    message: "Profile Created Successfully!",
    data,
  }, { status: 200 })
}
