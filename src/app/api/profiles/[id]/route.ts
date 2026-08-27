import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { createApiClient } from "@/lib/supabase/api";
import { fetchUserProfileCached } from "@/lib/api/profile-server";

import { UpdateProfileInput } from "@/lib/validations/profile";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

// GET api/profiles/[id]
export async function GET(request: NextRequest, { params }: RouteContext) {
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
  const { id } = await params;

  try {
    const profiles = await fetchUserProfileCached(id, token);

    if (!profiles || profiles.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Profile not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: profiles[0],
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

// PATCH api/profiles/[id]
export async function PATCH(request: NextRequest, { params }: RouteContext) {
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

  const { id } = await params;
  const body: UpdateProfileInput = await request.json();

  // If username is being updated, check if it is taken by another profile
  if (body.user_name) {
    const { data: userExists, error: userExistsError } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_name", body.user_name)
      .neq("id", id)
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
          error: "Username already exists. Please choose a different username.",
        },
        { status: 400 }
      );
    }
  }

  const { data, error } = await supabase
    .from("profiles")
    .update(body)
    .eq("id", id)
    .select("*")
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

  if (!data) {
    return NextResponse.json(
      {
        success: false,
        error: "Profile not found",
      },
      { status: 404 }
    );
  }

  // Revalidate profile cache tags
  revalidateTag(`user-profile-${id}`, "default");
  revalidateTag("user-profiles", "default");

  return NextResponse.json(
    {
      success: true,
      message: "Profile updated successfully",
      data,
    },
    { status: 200 }
  );
}

// DELETE api/profiles/[id]
export async function DELETE(request: NextRequest, { params }: RouteContext) {
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

  const { id } = await params;

  const { error } = await supabase
    .from("profiles")
    .delete()
    .eq("id", id)
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
  revalidateTag(`user-profile-${id}`, "default");
  revalidateTag("user-profiles", "default");

  return NextResponse.json(
    {
      success: true,
      message: "Profile deleted successfully",
    },
    { status: 200 }
  );
}
