"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { getUserProfile, clearProfileCache, createProfileApi } from "@/lib/api/profile";
import { uploadAvatarFile } from "@/lib/supabase/storage";
import type { UserProfile } from "@/types/profile";
import type { CreateProfileInput } from "@/lib/validations/profile";

interface ProfileContextType {
  userProfile: UserProfile | null;
  loading: boolean;
  error: Error | null;
  refetchProfile: (forceRefresh?: boolean) => Promise<void>;
  createProfile: (input: CreateProfileInput) => Promise<UserProfile>;
  uploadAvatar: (file: File) => Promise<string>;
  clearProfile: () => void;
}

const ProfileContext = createContext<ProfileContextType>({
  userProfile: null,
  loading: true,
  error: null,
  refetchProfile: async () => { },
  createProfile: async () => { throw new Error("ProfileProvider not initialized"); },
  uploadAvatar: async () => { throw new Error("ProfileProvider not initialized"); },
  clearProfile: () => { },
});

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProfile = useCallback(async (forceRefresh = false) => {
    try {
      if (forceRefresh) {
        setLoading(true);
      }
      const profileData = await getUserProfile(forceRefresh);
      if (profileData.success && profileData.data.length > 0) {
        setUserProfile(profileData.data[0]);
      } else {
        setUserProfile(null);
      }
      setError(null);
    } catch (err) {
      console.error("Error loading user profile:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile(false);
  }, [fetchProfile]);

  const createProfile = useCallback(async (input: CreateProfileInput): Promise<UserProfile> => {
    setLoading(true);
    try {
      const response = await createProfileApi(input);
      const created = response.data[0];
      setUserProfile(created);
      setError(null);
      return created;
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      setError(errorObj);
      throw errorObj;
    } finally {
      setLoading(false);
    }
  }, []);

  const uploadAvatar = useCallback(async (file: File): Promise<string> => {
    return await uploadAvatarFile(file);
  }, []);

  const clearProfile = useCallback(() => {
    clearProfileCache();
    setUserProfile(null);
  }, []);

  return (
    <ProfileContext.Provider
      value={{
        userProfile,
        loading,
        error,
        refetchProfile: fetchProfile,
        createProfile,
        uploadAvatar,
        clearProfile,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  return useContext(ProfileContext);
}

