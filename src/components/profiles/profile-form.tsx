
"use client";

import { useEffect, useState } from "react";
import createClient from "@/lib/supabase/client";
import type { Profile, ProfileFormData } from "@/types/profile";

export default function ProfileForm() {
  const supabase = createClient();

  const [fullName, setFullName] = useState<ProfileFormData["full_name"]>("");
  const [timezone, setTimezone] = useState<ProfileFormData["timezone"]>("Asia/Manila");
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [message, setMessage] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  // Load existing profile
  useEffect(() => {
    async function loadProfile() {
      setLoadingProfile(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setMessage("You must be logged in.");
        setLoadingProfile(false);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("full_name, timezone")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        setMessage(profileError.message);
        setLoadingProfile(false);
        return;
      }

      if (profile) {
        setFullName(profile.full_name ?? "");
        setTimezone(profile.timezone ?? "Asia/Manila");
        setIsEditing(true);
      }

      setLoadingProfile(false);
    }

    loadProfile();
  }, [supabase]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);
    setMessage("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setMessage("You must be logged in.");
      setLoading(false);
      return;
    }

    const payload: Profile = {
      id: user.id,
      full_name: fullName,
      timezone,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("profiles").upsert(payload);

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setIsEditing(true);
    setMessage("Profile saved successfully!");
    setLoading(false);
  }

  if (loadingProfile) {
    return <p>Loading profile...</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md space-y-4">
      <div>
        <label htmlFor="fullName" className="block mb-1">
          Full Name
        </label>

        <input
          id="fullName"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="John Doe"
          required
          className="w-full rounded-md border p-2"
        />
      </div>

      <div>
        <label htmlFor="timezone" className="block mb-1">
          Timezone
        </label>

        <select
          id="timezone"
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          className="w-full rounded-md border p-2"
        >
          <option value="Asia/Manila">Asia/Manila</option>
          <option value="Asia/Tokyo">Asia/Tokyo</option>
          <option value="Asia/Singapore">Asia/Singapore</option>
          <option value="UTC">UTC</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-black px-4 py-2 text-white disabled:opacity-50"
      >
        {loading
          ? "Saving..."
          : isEditing
            ? "Update Profile"
            : "Create Profile"}
      </button>

      {message && <p>{message}</p>}
    </form>
  );
}
