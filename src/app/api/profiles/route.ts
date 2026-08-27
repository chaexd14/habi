import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { createApiClient } from "@/lib/supabase/api";
import { fetchUserProfileCached } from "@/lib/api/profile-server";
import { CreateProfileInput } from "@/lib/validations/profile";

// GET api/profiles
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

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      {
        success: false,
        error: "Invalid token",
      },
      { status: 401 }
    );
  }

  try {
    const data = await fetchUserProfileCached(user.id, token);

    if (!data || data.length === 0) {
      return NextResponse.json(
        {
          success: true,
          message: "No user profiles found.",
          data: [],
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data,
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
        error: error instanceof Error ? error.message : "Failed to fetch cached user profile",
      },
      { status: 500 }
    );
  }
}

// POST /api/profiles
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
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      {
        success: false,
        error: "Invalid token or user not authenticated.",
      },
      { status: 401 }
    );
  }

  const body: CreateProfileInput = await request.json();

  // Check if username already exists
  const { data: userExists, error: userExistsError } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_name", body.user_name)
    .maybeSingle();

  if (userExistsError) {
    return NextResponse.json(
      {
        success: false,
        error: userExistsError.message,
      },
      { status: 500 }
    );
  }

  if (userExists) {
    return NextResponse.json(
      {
        success: false,
        error: "Username already exists.",
      },
      { status: 400 }
    );
  }

  // Create profile with user.id to satisfy RLS policy (auth.uid() = id)
  const profilePayload = {
    id: user.id,
    ...body,
  };

  const { data, error } = await supabase
    .from("profiles")
    .insert([profilePayload])
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

  // Revalidate profile cache tags
  if (data?.id) {
    revalidateTag(`user-profile-${data.id}`, "default");
  }
  revalidateTag("user-profiles", "default");

  return NextResponse.json(
    {
      success: true,
      message: "Profile created successfully!",
      data,
    },
    { status: 201 }
  );
}
