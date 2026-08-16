"use client";

import React, { useState, useEffect, useRef } from "react";
import { useProfile } from "@/providers/profile-provider";
import { CreateProfileSchema, CreateProfileInput } from "@/lib/validations/profile";
import { uploadAvatarFile } from "@/lib/supabase/storage";
import { createProfileApi } from "@/lib/api/profile";
import type { UserProfile } from "@/types/profile";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Upload, Camera, User } from "lucide-react";

export interface CreateUserProfileProps extends React.ComponentProps<"form"> {
  onSuccess?: (profile: UserProfile) => void;
}

const COMMON_TIMEZONES = [
  "Asia/Manila",
  "Asia/Tokyo",
  "Asia/Singapore",
  "Asia/Hong_Kong",
  "America/New_York",
  "America/Los_Angeles",
  "America/Chicago",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Australia/Sydney",
  "UTC",
];

const DEFAULT_AVATARS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
];

export function CreateUserProfile({
  className,
  onSuccess,
  ...props
}: CreateUserProfileProps) {
  const profileContext = useProfile();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [userName, setUserName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(DEFAULT_AVATARS[0]);
  const [timezone, setTimezone] = useState("UTC");
  const role = "USER";

  // UI Status
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Detect local timezone
  useEffect(() => {
    try {
      const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (localTz) {
        setTimezone(localTz);
      }
    } catch {
      // Fallback stays UTC
    }
  }, []);

  // Handle avatar upload
  const handleAvatarFile = async (file: File) => {
    setFormError(null);
    setIsUploading(true);

    try {
      const uploadedUrl = profileContext?.uploadAvatar
        ? await profileContext.uploadAvatar(file)
        : await uploadAvatarFile(file);

      setAvatarUrl(uploadedUrl);
      if (fieldErrors.avatar_url) {
        setFieldErrors((prev) => ({ ...prev, avatar_url: "" }));
      }
    } catch (err) {
      console.error("Avatar Upload Failure:", err);
      setFormError(err instanceof Error ? err.message : "Failed to upload avatar image.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleAvatarFile(file);
    }
  };

  // Submit profile form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});

    const formData: CreateProfileInput = {
      user_name: userName.trim(),
      avatar_url: avatarUrl,
      timezone,
      role,
    };

    const validation = CreateProfileSchema.safeParse(formData);
    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          errors[issue.path[0].toString()] = issue.message;
        }
      });
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);

    try {
      const createdProfile = profileContext?.createProfile
        ? await profileContext.createProfile(formData)
        : (await createProfileApi(formData)).data[0];

      if (onSuccess && createdProfile) {
        onSuccess(createdProfile);
      }
    } catch (err) {
      console.error("Create profile error:", err);
      setFormError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className={cn("flex flex-col gap-5", className)} onSubmit={handleSubmit} {...props}>
      <FieldGroup className="space-y-4">
        {formError && (
          <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive font-medium">
            {formError}
          </div>
        )}

        {/* Avatar Upload */}
        <Field>
          <FieldLabel>Profile Avatar</FieldLabel>
          <div className="flex items-center gap-4 pt-1">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative group cursor-pointer size-18 rounded-full border border-border/80 overflow-hidden shrink-0 transition-all hover:opacity-90 shadow-xs"
            >
              <Avatar className="size-full">
                <AvatarImage src={avatarUrl} alt="Avatar Preview" className="object-cover" />
                <AvatarFallback className="text-base font-bold bg-muted">
                  {userName ? userName.slice(0, 2).toUpperCase() : <User className="size-5 text-muted-foreground" />}
                </AvatarFallback>
              </Avatar>

              <div className={`absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white transition-opacity ${
                isUploading ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              }`}>
                {isUploading ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : (
                  <Camera className="size-4" />
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            <div className="flex-1 space-y-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isUploading}
                onClick={() => fileInputRef.current?.click()}
                className="h-8.5 font-medium"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-1.5 size-3.5" />
                    Upload Photo
                  </>
                )}
              </Button>

              <div className="flex items-center gap-1.5 pt-0.5">
                <span className="text-[11px] text-muted-foreground">Or pick:</span>
                {DEFAULT_AVATARS.map((url, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setAvatarUrl(url)}
                    className={`size-6 rounded-full overflow-hidden border-2 transition-transform hover:scale-110 cursor-pointer ${
                      avatarUrl === url ? "border-primary ring-1 ring-primary/40" : "border-transparent opacity-75 hover:opacity-100"
                    }`}
                  >
                    <img src={url} alt={`Preset ${idx + 1}`} className="size-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>
          {fieldErrors.avatar_url && (
            <FieldError errors={[{ message: fieldErrors.avatar_url }]} />
          )}
        </Field>

        {/* Username */}
        <Field>
          <FieldLabel htmlFor="user_name">Username</FieldLabel>
          <Input
            id="user_name"
            type="text"
            placeholder="johndoe"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            disabled={isSubmitting}
            required
            className="h-11"
            aria-invalid={!!fieldErrors.user_name}
          />
          {fieldErrors.user_name ? (
            <FieldError errors={[{ message: fieldErrors.user_name }]} />
          ) : (
            <FieldDescription>
              Your unique display handle across Habi.
            </FieldDescription>
          )}
        </Field>

        {/* Timezone */}
        <Field>
          <FieldLabel htmlFor="timezone">Timezone</FieldLabel>
          <select
            id="timezone"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            disabled={isSubmitting}
            className="h-11 w-full rounded-lg border border-border/80 bg-background px-3 text-xs shadow-2xs outline-none focus-visible:border-ring disabled:pointer-events-none disabled:opacity-50 dark:bg-input/20 cursor-pointer"
          >
            {!COMMON_TIMEZONES.includes(timezone) && timezone && (
              <option value={timezone}>{timezone} (Auto-Detected)</option>
            )}
            {COMMON_TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
          <FieldDescription>
            Used for scheduling, notifications, and calendar views.
          </FieldDescription>
        </Field>

        {/* Submit Button */}
        <Field className="pt-2">
          <Button type="submit" disabled={isSubmitting || isUploading} className="h-11 font-bold w-full shadow-xs">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Saving Profile...
              </>
            ) : (
              "Complete Setup"
            )}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
}

export default CreateUserProfile;
