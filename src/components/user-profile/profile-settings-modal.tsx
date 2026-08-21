"use client";

import * as React from "react";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { useProfile } from "@/providers/profile-provider";
import { UpdateProfileSchema, UpdateProfileInput } from "@/lib/validations/profile";
import { uploadAvatarFile } from "@/lib/supabase/storage";
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
import {
  X,
  Upload,
  Camera,
  User,
  Check,
  Loader2,
  Globe,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
} from "lucide-react";

export interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
}

const COMMON_TIMEZONES = [
  "Asia/Manila",
  "Asia/Tokyo",
  "Asia/Singapore",
  "Asia/Hong_Kong",
  "America/New_York",
  "America/Los_Angeles",
  "America/Chicago",
  "America/Denver",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Australia/Sydney",
  "UTC",
];

const PRESET_AVATARS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80",
];

export function ProfileSettingsModal({
  isOpen,
  onClose,
  userProfile,
}: ProfileSettingsModalProps) {
  const { updateProfile, uploadAvatar } = useProfile();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);

  // Form states
  const [userName, setUserName] = useState(userProfile.user_name || "");
  const [avatarUrl, setAvatarUrl] = useState(userProfile.avatar_url || PRESET_AVATARS[0]);
  const [timezone, setTimezone] = useState(userProfile.timezone || "UTC");

  // Interaction & status states
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync state whenever userProfile prop or isOpen changes
  useEffect(() => {
    if (isOpen) {
      setUserName(userProfile.user_name || "");
      setAvatarUrl(userProfile.avatar_url || PRESET_AVATARS[0]);
      setTimezone(userProfile.timezone || "UTC");
      setFormError(null);
      setSuccessMessage(null);
      setFieldErrors({});
    }
  }, [isOpen, userProfile]);

  // Handle ESC key press & scroll locking
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  const isChanged =
    userName.trim() !== userProfile.user_name ||
    avatarUrl !== userProfile.avatar_url ||
    timezone !== userProfile.timezone;

  const timezoneItems = React.useMemo(() => [
    ...(!COMMON_TIMEZONES.includes(timezone) && timezone
      ? [{ label: `${timezone} (Custom / Local)`, value: timezone }]
      : []),
    ...COMMON_TIMEZONES.map((tz) => ({ label: tz, value: tz })),
  ], [timezone]);

  const initials = userName
    ? userName.slice(0, 2).toUpperCase()
    : userProfile.user_name
    ? userProfile.user_name.slice(0, 2).toUpperCase()
    : "HB";

  // Handle avatar file upload
  const handleAvatarFile = async (file: File) => {
    setFormError(null);
    setSuccessMessage(null);
    setIsUploading(true);

    try {
      const uploadedUrl = uploadAvatar
        ? await uploadAvatar(file)
        : await uploadAvatarFile(file);

      setAvatarUrl(uploadedUrl);
      if (fieldErrors.avatar_url) {
        setFieldErrors((prev) => ({ ...prev, avatar_url: "" }));
      }
    } catch (err) {
      console.error("Avatar Upload Failure:", err);
      setFormError(
        err instanceof Error ? err.message : "Failed to upload avatar image."
      );
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

  const handleAutoDetectTimezone = () => {
    try {
      const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (detected) {
        setTimezone(detected);
      }
    } catch {
      // ignore
    }
  };

  const handleReset = () => {
    setUserName(userProfile.user_name || "");
    setAvatarUrl(userProfile.avatar_url || PRESET_AVATARS[0]);
    setTimezone(userProfile.timezone || "UTC");
    setFormError(null);
    setFieldErrors({});
  };

  // Submit profile updates
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMessage(null);
    setFieldErrors({});

    const formData: UpdateProfileInput = {
      user_name: userName.trim(),
      avatar_url: avatarUrl,
      timezone,
    };

    const validation = UpdateProfileSchema.safeParse(formData);
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
      await updateProfile(userProfile.id, formData);
      setSuccessMessage("Profile updated successfully!");

      // Auto dismiss modal after brief confirmation
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      console.error("Update profile error:", err);
      setFormError(
        err instanceof Error ? err.message : "An unexpected error occurred while updating profile."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile_settings_title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
      />

      {/* Modal Dialog Box */}
      <div className="relative w-full max-w-md rounded-xl border border-border bg-card text-card-foreground p-5 sm:p-6 shadow-xl z-10 max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-98 duration-150 space-y-4">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close profile settings"
          className="absolute top-4 right-4 p-1.5 rounded-md text-muted-foreground/70 hover:text-foreground hover:bg-muted/70 transition-colors cursor-pointer"
        >
          <X className="size-4" />
        </button>

        {/* Modal Header */}
        <div className="space-y-1 text-left pr-6">
          <div className="flex items-center gap-2">
            <h2
              id="profile_settings_title"
              className="text-base font-semibold tracking-tight text-foreground"
            >
              Profile Settings
            </h2>
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary border border-primary/20">
              <ShieldCheck className="size-3" />
              {userProfile.role || "USER"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Update your account handle, avatar photo, and timezone preferences.
          </p>
        </div>

        {/* Status Alerts */}
        {formError && (
          <div
            role="alert"
            aria-live="polite"
            className="flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/20 p-2.5 text-xs text-destructive font-medium animate-in fade-in duration-100"
          >
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            <span className="flex-1 leading-tight">{formError}</span>
          </div>
        )}

        {successMessage && (
          <div
            role="alert"
            aria-live="polite"
            className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-2.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium animate-in fade-in duration-100"
          >
            <CheckCircle2 className="size-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <FieldGroup className="space-y-4">
            {/* Avatar Section */}
            <Field className="space-y-2">
              <FieldLabel className="text-xs font-medium text-foreground">
                Profile Avatar
              </FieldLabel>
              <div className="flex items-center gap-4 pt-1">
                {/* Clickable Avatar Preview */}
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
                  className="relative group cursor-pointer size-16 sm:size-18 rounded-xl border border-border overflow-hidden shrink-0 transition-all hover:ring-2 hover:ring-primary/40 shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Avatar className="size-full rounded-xl">
                    <AvatarImage
                      src={avatarUrl}
                      alt={userName || "User Avatar"}
                      className="object-cover size-full"
                    />
                    <AvatarFallback className="text-base font-semibold bg-muted text-foreground rounded-xl flex items-center justify-center">
                      {initials || <User className="size-6 text-muted-foreground" />}
                    </AvatarFallback>
                  </Avatar>

                  {/* Hover / Uploading Scrim Overlay */}
                  <div
                    className={cn(
                      "absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white transition-opacity",
                      isUploading ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    )}
                  >
                    {isUploading ? (
                      <Loader2 className="size-4 animate-spin text-white" />
                    ) : (
                      <Camera className="size-4 text-white drop-shadow" />
                    )}
                    <span className="text-[9px] font-medium mt-0.5">
                      {isUploading ? "Uploading" : "Change"}
                    </span>
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

                {/* Upload Action & Presets */}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="xs"
                      disabled={isUploading || isSubmitting}
                      onClick={() => fileInputRef.current?.click()}
                      className="h-7 text-xs font-medium rounded-md cursor-pointer transition-colors"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="mr-1 size-3 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-1 size-3" />
                          Upload Photo
                        </>
                      )}
                    </Button>
                    <span className="text-[10px] text-muted-foreground">
                      JPG, PNG, WEBP (max 5MB)
                    </span>
                  </div>

                  {/* Avatar Presets Picker */}
                  <div className="space-y-1">
                    <span className="text-[10px] text-muted-foreground font-normal flex items-center gap-1">
                      <Sparkles className="size-2.5 opacity-70" />
                      Or choose an avatar preset:
                    </span>
                    <div
                      role="radiogroup"
                      aria-label="Preset avatar choices"
                      className="flex items-center gap-1.5 flex-wrap pt-0.5"
                    >
                      {PRESET_AVATARS.map((url, idx) => {
                        const isSelected = avatarUrl === url;
                        return (
                          <button
                            key={idx}
                            type="button"
                            role="radio"
                            aria-checked={isSelected}
                            aria-label={`Select avatar preset ${idx + 1}`}
                            onClick={() => setAvatarUrl(url)}
                            className={cn(
                              "size-6 rounded-md overflow-hidden border transition-all cursor-pointer",
                              isSelected
                                ? "border-primary ring-2 ring-primary/40 scale-105"
                                : "border-border/60 opacity-60 hover:opacity-100 hover:border-border"
                            )}
                          >
                            <Image
                              src={url}
                              alt={`Preset avatar ${idx + 1}`}
                              width={24}
                              height={24}
                              unoptimized
                              className="size-full object-cover"
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
              {fieldErrors.avatar_url && (
                <FieldError errors={[{ message: fieldErrors.avatar_url }]} />
              )}
            </Field>

            {/* Username Field */}
            <Field className="space-y-1">
              <FieldLabel
                htmlFor="profile_edit_username"
                className="text-xs font-medium text-foreground"
              >
                Username
              </FieldLabel>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none text-muted-foreground font-mono text-xs">
                  @
                </div>
                <Input
                  id="profile_edit_username"
                  type="text"
                  placeholder="your_handle"
                  autoComplete="username"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  disabled={isSubmitting}
                  required
                  className="h-8.5 pl-6.5 rounded-md font-mono text-xs"
                  aria-invalid={!!fieldErrors.user_name}
                />
              </div>
              {fieldErrors.user_name ? (
                <FieldError errors={[{ message: fieldErrors.user_name }]} />
              ) : (
                <FieldDescription className="text-[11px] text-muted-foreground">
                  Your unique handle across calendars, routines, and workspace views.
                </FieldDescription>
              )}
            </Field>

            {/* Timezone Field */}
            <Field className="space-y-1">
              <div className="flex items-center justify-between">
                <FieldLabel
                  htmlFor="profile_edit_timezone"
                  className="text-xs font-medium text-foreground flex items-center gap-1.5"
                >
                  <Globe className="size-3.5 opacity-70" />
                  <span>Timezone</span>
                </FieldLabel>
                <button
                  type="button"
                  onClick={handleAutoDetectTimezone}
                  className="text-[11px] text-primary hover:underline font-medium cursor-pointer"
                >
                  Auto-Detect
                </button>
              </div>
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
                Syncs daily timetable schedules, calendar timelines, and reminder notifications.
              </FieldDescription>
            </Field>

            {/* Account Metadata Card */}
            <div className="rounded-lg bg-muted/40 border border-border/80 p-3 space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">Account ID</span>
                <span className="font-mono text-foreground font-medium text-[10px] bg-background px-1.5 py-0.5 rounded border border-border">
                  {userProfile.id ? `${userProfile.id.slice(0, 8)}...${userProfile.id.slice(-4)}` : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">Access Level</span>
                <span className="text-foreground font-medium">{userProfile.role || "Standard User"}</span>
              </div>
            </div>
          </FieldGroup>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2 border-t border-border mt-4">
            {isChanged ? (
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={handleReset}
                disabled={isSubmitting}
                className="text-[11px] text-muted-foreground hover:text-foreground h-7 px-2 rounded cursor-pointer"
              >
                <RotateCcw className="size-3 mr-1" />
                Reset
              </Button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                disabled={isSubmitting}
                className="h-8 text-xs rounded-md font-medium cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting || isUploading || !isChanged}
                className="h-8 text-xs rounded-md font-medium shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <span>Save Changes</span>
                    <Check className="size-3.5" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

export default ProfileSettingsModal;
