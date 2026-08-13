import { UserProfileResponse } from "@/types/profile";
import { CreateProfileInput } from "@/lib/validations/profile";
import createClient from "@/lib/supabase/client";

const CACHE_KEY = "habi_user_profile_cache";

let cachedProfileResponse: UserProfileResponse | null = null;
let profilePromise: Promise<UserProfileResponse> | null = null;

export async function getUserProfile(forceRefresh = false): Promise<UserProfileResponse> {
  if (!forceRefresh) {
    if (cachedProfileResponse) {
      return cachedProfileResponse;
    }

    if (typeof window !== "undefined") {
      try {
        const stored = sessionStorage.getItem(CACHE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as UserProfileResponse;
          cachedProfileResponse = parsed;
          return parsed;
        }
      } catch (e) {
        console.error("Failed to read profile from sessionStorage:", e);
      }
    }

    if (profilePromise) {
      return profilePromise;
    }
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

      const url = forceRefresh ? `/api/profiles?t=${Date.now()}` : "/api/profiles";
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
        },
        cache: forceRefresh ? "no-store" : "default",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch user profile: ${response.statusText}`);
      }

      const data: UserProfileResponse = await response.json();
      if (data.success) {
        cachedProfileResponse = data;
        if (typeof window !== "undefined") {
          try {
            sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
          } catch (e) {
            console.error("Failed to save profile to sessionStorage:", e);
          }
        }
      }
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

  // Clear cache & re-fetch to sync cached state
  clearProfileCache();
  
  // Format single inserted record into UserProfileResponse if needed
  const newProfile = resJson.data;
  const updatedResponse: UserProfileResponse = {
    success: true,
    message: resJson.message || "Profile created successfully!",
    data: Array.isArray(newProfile) ? newProfile : [newProfile],
  };

  cachedProfileResponse = updatedResponse;
  if (typeof window !== "undefined") {
    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(updatedResponse));
    } catch (e) {
      console.error("Failed to save new profile to sessionStorage:", e);
    }
  }

  return updatedResponse;
}

export function clearProfileCache() {
  cachedProfileResponse = null;
  profilePromise = null;
  if (typeof window !== "undefined") {
    try {
      sessionStorage.removeItem(CACHE_KEY);
    } catch (e) {
      // ignore
    }
  }
}
