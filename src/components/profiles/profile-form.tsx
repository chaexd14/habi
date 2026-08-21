"use client";

import { useEffect, useState } from "react";
import createClient from "@/lib/supabase/client";
import type { Profile, ProfileFormData } from "@/types/profile";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, User, Globe } from "lucide-react";

export default function ProfileForm() {
  const supabase = createClient();

  const [fullName, setFullName] = useState<ProfileFormData["full_name"]>("");
  const [timezone, setTimezone] = useState<ProfileFormData["timezone"]>("Asia/Manila");
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
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
        setMessage({ text: "You must be logged in.", type: "error" });
        setLoadingProfile(false);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("full_name, timezone")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        setMessage({ text: profileError.message, type: "error" });
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
    setMessage(null);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setMessage({ text: "You must be logged in.", type: "error" });
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
      setMessage({ text: error.message, type: "error" });
      setLoading(false);
      return;
    }

    setIsEditing(true);
    setMessage({ text: "Profile updated successfully!", type: "success" });
    setLoading(false);
  }

  if (loadingProfile) {
    return (
      <div className="flex items-center gap-2 p-4 text-xs text-muted-foreground">
        <Loader2 className="size-3.5 animate-spin" />
        <span>Loading profile settings...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md space-y-3 text-left">
      {message && (
        <div
          className={`p-2.5 rounded-md text-xs font-medium border flex items-center gap-2 ${
            message.type === "success"
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
              : "bg-destructive/10 text-destructive border-destructive/20"
          }`}
        >
          {message.type === "success" && <CheckCircle2 className="size-3.5 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      <div className="space-y-1">
        <label htmlFor="fullName" className="text-xs font-medium text-foreground flex items-center gap-1.5">
          <User className="size-3.5 text-muted-foreground" />
          Full Name
        </label>
        <Input
          id="fullName"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="John Doe"
          required
          className="h-8.5 rounded-md"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="timezone" className="text-xs font-medium text-foreground flex items-center gap-1.5">
          <Globe className="size-3.5 text-muted-foreground" />
          Timezone
        </label>
        <select
          id="timezone"
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          className="h-8.5 w-full rounded-md border border-border bg-background px-2.5 text-xs font-medium shadow-2xs outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
        >
          <option value="Asia/Manila">Asia/Manila</option>
          <option value="Asia/Tokyo">Asia/Tokyo</option>
          <option value="Asia/Singapore">Asia/Singapore</option>
          <option value="America/New_York">America/New_York</option>
          <option value="America/Los_Angeles">America/Los_Angeles</option>
          <option value="Europe/London">Europe/London</option>
          <option value="UTC">UTC</option>
        </select>
      </div>

      <div className="pt-2">
        <Button
          type="submit"
          disabled={loading}
          className="w-full h-8.5 rounded-md font-medium text-xs shadow-2xs"
        >
          {loading ? (
            <>
              <Loader2 className="mr-1.5 size-3.5 animate-spin" />
              Saving...
            </>
          ) : isEditing ? (
            "Update Profile"
          ) : (
            "Create Profile"
          )}
        </Button>
      </div>
    </form>
  );
}
