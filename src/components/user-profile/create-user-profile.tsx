"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { useProfile } from "@/providers/profile-provider";
import { CreateProfileSchema, CreateProfileInput } from "@/lib/validations/profile";
import { uploadAvatarFile } from "@/lib/supabase/storage";
import { createProfileApi } from "@/lib/api/profile";
import type { UserProfile } from "@/types/profile";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Upload, Camera, User, Check } from "lucide-react";

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

  // Form State with auto-detected timezone
  const [userName, setUserName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(DEFAULT_AVATARS[0]);
  const [timezone, setTimezone] = useState(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    } catch {
      return "UTC";
    }
  });
  const role = "USER";

  const timezoneItems = React.useMemo(() => [
    ...(!COMMON_TIMEZONES.includes(timezone) && timezone
      ? [{ label: `${timezone} (Auto-Detected)`, value: timezone }]
      : []),
    ...COMMON_TIMEZONES.map((tz) => ({ label: tz, value: tz })),
  ], [timezone]);

  // UI Status
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

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
    <form className={cn("flex flex-col gap-3.5", className)} onSubmit={handleSubmit} {...props}>
      <FieldGroup className="space-y-3.5">
        {formError && (
          <div
            role="alert"
            aria-live="polite"
            className="rounded-md bg-destructive/10 border border-destructive/20 p-2.5 text-xs text-destructive font-medium"
          >
            {formError}
          </div>
        )}

        {/* Avatar Upload */}
        <Field>
          <FieldLabel className="text-xs font-medium">Avatar</FieldLabel>
          <div className="flex items-center gap-3.5 pt-0.5">
            <div
              role="button"
              tabIndex={0}
              aria-label="Upload custom avatar image"
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              className="relative group cursor-pointer size-16 rounded-md border border-border overflow-hidden shrink-0 transition-opacity hover:opacity-90 shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <Avatar className="size-full rounded-md">
                <AvatarImage src={avatarUrl} alt="Avatar Preview" className="object-cover" />
                <AvatarFallback className="text-sm font-medium bg-muted rounded-md">
                  {userName ? userName.slice(0, 2).toUpperCase() : <User className="size-5 text-muted-foreground" />}
                </AvatarFallback>
              </Avatar>

              <div
                className={`absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white transition-opacity ${
                  isUploading ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                }`}
              >
                {isUploading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Camera className="size-4" />
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                aria-label="Upload photo file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            <div className="flex-1 space-y-1.5">
              <Button
                type="button"
                variant="outline"
                size="xs"
                disabled={isUploading}
                onClick={() => fileInputRef.current?.click()}
                className="h-7 text-xs font-medium rounded-md cursor-pointer"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-1 size-3 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-1 size-3" />
                    Upload Image
                  </>
                )}
              </Button>

              <div
                role="radiogroup"
                aria-label="Preset avatar choices"
                className="flex items-center gap-1.5"
              >
                <span className="text-[10px] text-muted-foreground font-normal">Presets:</span>
                {DEFAULT_AVATARS.map((url, idx) => {
                  const isSelected = avatarUrl === url;
                  return (
                    <button
                      key={idx}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      aria-label={`Select preset avatar ${idx + 1}`}
                      onClick={() => setAvatarUrl(url)}
                      className={`size-5 rounded overflow-hidden border transition-transform hover:scale-105 cursor-pointer ${
                        isSelected ? "border-foreground ring-1 ring-foreground/40" : "border-transparent opacity-60 hover:opacity-100"
                      }`}
                    >
                      <Image
                        src={url}
                        alt={`Preset ${idx + 1}`}
                        width={20}
                        height={20}
                        unoptimized
                        className="size-full object-cover"
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          {fieldErrors.avatar_url && (
            <FieldError errors={[{ message: fieldErrors.avatar_url }]} />
          )}
        </Field>

        {/* Username */}
        <Field>
          <FieldLabel htmlFor="profile_user_name" className="text-xs font-medium">Username</FieldLabel>
          <Input
            id="profile_user_name"
            type="text"
            placeholder="johndoe"
            autoComplete="username"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            disabled={isSubmitting}
            required
            className="h-8.5 rounded-md"
            aria-invalid={!!fieldErrors.user_name}
          />
          {fieldErrors.user_name ? (
            <FieldError errors={[{ message: fieldErrors.user_name }]} />
          ) : (
            <FieldDescription className="text-[11px] text-muted-foreground">
              Your unique handle across Habi.
            </FieldDescription>
          )}
        </Field>

        {/* Timezone */}
        <Field>
          <FieldLabel htmlFor="profile_timezone" className="text-xs font-medium">Timezone</FieldLabel>
          <Select
            items={timezoneItems}
            value={timezone}
            onValueChange={(val) => {
              if (val) setTimezone(val);
            }}
            disabled={isSubmitting}
          >
            <SelectTrigger className="h-8.5 w-full bg-background text-xs font-medium">
              <SelectValue placeholder="Select Timezone" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {timezoneItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldDescription className="text-[11px] text-muted-foreground">
            Used for schedule timetable and reminder notifications.
          </FieldDescription>
        </Field>

        {/* Submit Button */}
        <Field className="pt-1">
          <Button
            type="submit"
            disabled={isSubmitting || isUploading}
            className="h-8.5 font-medium text-xs w-full rounded-md shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <span>Complete Setup</span>
                <Check className="size-3.5" />
              </>
            )}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
}

export default CreateUserProfile;
