import { UserProfileResponse } from "@/types/profile";
import { CreateProfileInput, UpdateProfileInput } from "@/lib/validations/profile";
import createClient from "@/lib/supabase/client";

let profilePromise: Promise<UserProfileResponse> | null = null;

export async function getUserProfile(forceRefresh = false): Promise<UserProfileResponse> {
  if (!forceRefresh && profilePromise) {
    return profilePromise;
  }

  profilePromise = (async () => {
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        return {
          success: true,
          message: "User not logged in",
          data: [],
        };
      }

      const url = `/api/profiles?t=${Date.now()}`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
        },
        cache: "no-store",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch user profile: ${response.statusText}`);
      }

      const data: UserProfileResponse = await response.json();
      return data;
    } finally {
      profilePromise = null;
    }
  })();

  return profilePromise;
}

export async function createProfileApi(profileData: CreateProfileInput): Promise<UserProfileResponse> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("You must be signed in to create a profile.");
  }

  const response = await fetch("/api/profiles", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(profileData),
  });

  const resJson = await response.json();

  if (!response.ok || !resJson.success) {
    throw new Error(resJson.error || resJson.message || "Failed to create profile.");
  }

  clearProfileCache();
  
  const newProfile = resJson.data;
  const updatedResponse: UserProfileResponse = {
    success: true,
    message: resJson.message || "Profile created successfully!",
    data: Array.isArray(newProfile) ? newProfile : [newProfile],
  };

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("habi:data-invalidated", { detail: { type: "user-profile" } }));
  }

  return updatedResponse;
}

export async function updateProfileApi(
  id: string,
  profileData: UpdateProfileInput
): Promise<UserProfileResponse> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("You must be signed in to update your profile.");
  }

  const response = await fetch(`/api/profiles/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(profileData),
  });

  const resJson = await response.json();

  if (!response.ok || !resJson.success) {
    throw new Error(resJson.error || resJson.message || "Failed to update profile.");
  }

  clearProfileCache();

  const updatedProfile = resJson.data;
  const updatedResponse: UserProfileResponse = {
    success: true,
    message: resJson.message || "Profile updated successfully!",
    data: Array.isArray(updatedProfile) ? updatedProfile : [updatedProfile],
  };

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("habi:data-invalidated", { detail: { type: "user-profile" } }));
  }

  return updatedResponse;
}

export function clearProfileCache() {
  profilePromise = null;
}
