"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useSettings } from "@/providers/settings-provider";
import {
  TimeFormat,
  NotificationAlertMinutes,
  NOTIFICATION_ALERT_OPTIONS,
} from "@/types/settings";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  X,
  Clock,
  Bell,
  Check,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Sliders,
  Sparkles,
  SunMoon,
} from "lucide-react";

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { settings, updateSettings } = useSettings();
  const [mounted, setMounted] = useState(false);

  // Local form state
  const [timeFormat, setTimeFormat] = useState<TimeFormat>(settings.timeFormat);
  const [notificationAlert, setNotificationAlert] =
    useState<NotificationAlertMinutes>(settings.notificationAlert);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync state whenever settings change or modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeFormat(settings.timeFormat);
      setNotificationAlert(settings.notificationAlert);
      setFormError(null);
      setSuccessMessage(null);
      setCurrentTime(new Date());
    }
  }, [isOpen, settings]);

  // Live clock tick
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

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
    timeFormat !== settings.timeFormat ||
    notificationAlert !== settings.notificationAlert;

  // Format live preview string
  const formatLiveClock = (date: Date, fmt: TimeFormat) => {
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const seconds = date.getSeconds().toString().padStart(2, "0");

    if (fmt === "24h") {
      return `${hours.toString().padStart(2, "0")}:${minutes}:${seconds}`;
    }

    const period = hours >= 12 ? "PM" : "AM";
    const h12 = hours % 12 === 0 ? 12 : hours % 12;
    return `${h12}:${minutes}:${seconds} ${period}`;
  };

  // Example alert calculation
  const getAlertExample = (alertMins: NotificationAlertMinutes, fmt: TimeFormat) => {
    const eventTimeStr = fmt === "24h" ? "09:00" : "9:00 AM";
    let triggerTimeStr: string;

    if (alertMins === 60) {
      triggerTimeStr = fmt === "24h" ? "08:00" : "8:00 AM";
    } else if (alertMins === 30) {
      triggerTimeStr = fmt === "24h" ? "08:30" : "8:30 AM";
    } else if (alertMins === 15) {
      triggerTimeStr = fmt === "24h" ? "08:45" : "8:45 AM";
    } else {
      triggerTimeStr = fmt === "24h" ? "08:50" : "8:50 AM";
    }

    const label = alertMins === 60 ? "1 hour" : `${alertMins} min`;
    return { eventTimeStr, triggerTimeStr, label };
  };

  const alertExample = getAlertExample(notificationAlert, timeFormat);

  const handleReset = () => {
    setTimeFormat(settings.timeFormat);
    setNotificationAlert(settings.notificationAlert);
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      updateSettings({
        timeFormat,
        notificationAlert,
      });

      setSuccessMessage("Settings saved successfully!");

      setTimeout(() => {
        onClose();
      }, 900);
    } catch (err) {
      console.error("Save settings error:", err);
      setFormError(
        err instanceof Error ? err.message : "An unexpected error occurred while saving settings."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="app_settings_title"
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
          aria-label="Close settings"
          className="absolute top-4 right-4 p-1.5 rounded-md text-muted-foreground/70 hover:text-foreground hover:bg-muted/70 transition-colors cursor-pointer"
        >
          <X className="size-4" />
        </button>

        {/* Modal Header */}
        <div className="space-y-1 text-left pr-6">
          <div className="flex items-center gap-2">
            <h2
              id="app_settings_title"
              className="text-base font-semibold tracking-tight text-foreground"
            >
              Settings
            </h2>
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary border border-primary/20">
              <Sliders className="size-3" />
              Preferences
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Customize clock display conventions and scheduled notification alert lead times.
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
            {/* Time Format Section */}
            <Field className="space-y-2">
              <div className="flex items-center justify-between">
                <FieldLabel className="text-xs font-medium text-foreground flex items-center gap-1.5">
                  <Clock className="size-3.5 opacity-70" />
                  <span>Time Format</span>
                </FieldLabel>
                <span className="text-[11px] font-mono text-muted-foreground bg-muted/60 px-2 py-0.5 rounded border border-border/50">
                  {formatLiveClock(currentTime, timeFormat)}
                </span>
              </div>

              <div
                role="radiogroup"
                aria-label="Select time format"
                className="grid grid-cols-2 gap-2"
              >
                {/* 12-Hour Option */}
                <button
                  type="button"
                  role="radio"
                  aria-checked={timeFormat === "12h"}
                  onClick={() => setTimeFormat("12h")}
                  className={cn(
                    "p-3 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between gap-2",
                    timeFormat === "12h"
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-2xs"
                      : "border-border bg-card/50 hover:bg-muted/40 hover:border-border"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <SunMoon className="size-3.5 text-primary shrink-0" />
                      <span className="text-xs font-semibold text-foreground">12 Hours</span>
                    </div>
                    {timeFormat === "12h" && (
                      <div className="size-4 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                        <Check className="size-2.5 stroke-[3]" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-0.5">
                    <span className="inline-block font-mono text-[11px] font-semibold text-foreground bg-muted/60 px-1.5 py-0.5 rounded border border-border/40">
                      02:30 PM
                    </span>
                    <p className="text-[10px] text-muted-foreground">Standard 12-hour AM/PM</p>
                  </div>
                </button>

                {/* 24-Hour Option */}
                <button
                  type="button"
                  role="radio"
                  aria-checked={timeFormat === "24h"}
                  onClick={() => setTimeFormat("24h")}
                  className={cn(
                    "p-3 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between gap-2",
                    timeFormat === "24h"
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-2xs"
                      : "border-border bg-card/50 hover:bg-muted/40 hover:border-border"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Clock className="size-3.5 text-primary shrink-0" />
                      <span className="text-xs font-semibold text-foreground">24 Hours</span>
                    </div>
                    {timeFormat === "24h" && (
                      <div className="size-4 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                        <Check className="size-2.5 stroke-[3]" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-0.5">
                    <span className="inline-block font-mono text-[11px] font-semibold text-foreground bg-muted/60 px-1.5 py-0.5 rounded border border-border/40">
                      14:30
                    </span>
                    <p className="text-[10px] text-muted-foreground">24-hour military format</p>
                  </div>
                </button>
              </div>

              <FieldDescription className="text-[11px] text-muted-foreground">
                Applies to the dashboard planner, calendar timeline, notifications, and timetable.
              </FieldDescription>
            </Field>

            {/* Notification Alert Section */}
            <Field className="space-y-2 pt-1 border-t border-border mt-3">
              <FieldLabel className="text-xs font-medium text-foreground flex items-center gap-1.5 pt-2">
                <Bell className="size-3.5 opacity-70" />
                <span>Notification Alert Lead Time</span>
              </FieldLabel>

              <div
                role="radiogroup"
                aria-label="Select notification alert lead time"
                className="grid grid-cols-2 gap-2"
              >
                {NOTIFICATION_ALERT_OPTIONS.map((opt) => {
                  const isSelected = notificationAlert === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => setNotificationAlert(opt.value)}
                      className={cn(
                        "p-2.5 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between gap-1",
                        isSelected
                          ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-2xs"
                          : "border-border bg-card/50 hover:bg-muted/40 hover:border-border"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-foreground">
                          {opt.shortLabel}
                        </span>
                        {isSelected && (
                          <div className="size-3.5 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                            <Check className="size-2 stroke-[3]" />
                          </div>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground line-clamp-1 leading-tight">
                        {opt.label}
                      </p>
                    </button>
                  );
                })}
              </div>

              <FieldDescription className="text-[11px] text-muted-foreground">
                Triggers browser notifications and banner toasts before upcoming routines begin.
              </FieldDescription>
            </Field>

            {/* Live Contextual Preview Card */}
            <div className="rounded-lg bg-muted/40 border border-border/80 p-3 space-y-2 mt-2">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-foreground">
                <Sparkles className="size-3 text-primary" />
                <span>Preview & Example Trigger</span>
              </div>
              <div className="space-y-1 text-[11px]">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Sample Routine:</span>
                  <span className="font-medium text-foreground font-mono">
                    Focus Block ({alertExample.eventTimeStr})
                  </span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Alert Fires At:</span>
                  <span className="font-medium text-primary font-mono bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                    {alertExample.triggerTimeStr} ({alertExample.label} prior)
                  </span>
                </div>
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
                disabled={isSubmitting || !isChanged}
                className="h-8 text-xs rounded-md font-medium shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isSubmitting ? (
                  <span>Saving...</span>
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

export default SettingsModal;
