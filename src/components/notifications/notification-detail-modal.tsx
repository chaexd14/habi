"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNotifications } from "@/providers/notification-provider";
import { useSettings } from "@/providers/settings-provider";
import { NotificationType, NotificationItem } from "@/types/notification";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  X,
  Zap,
  Clock,
  Calendar,
  CalendarDays,
  Trash2,
  CheckCheck,
  RotateCcw,
  FileText,
  Layers,
  Sparkles,
  Info,
  Clock3,
  CalendarCheck2,
} from "lucide-react";

function formatDuration(startTime?: string | null, endTime?: string | null): string | null {
  if (!startTime || !endTime) return null;
  const [sH, sM] = startTime.split(":").map((v) => parseInt(v, 10));
  const [eH, eM] = endTime.split(":").map((v) => parseInt(v, 10));
  if (isNaN(sH) || isNaN(sM) || isNaN(eH) || isNaN(eM)) return null;

  const startTotal = sH * 60 + sM;
  let endTotal = eH * 60 + eM;
  if (endTotal < startTotal) {
    endTotal += 24 * 60; // Next day
  }

  const diffMinutes = endTotal - startTotal;
  if (diffMinutes <= 0) return null;

  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;

  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (hours > 0) {
    return `${hours} hr${hours > 1 ? "s" : ""}`;
  }
  return `${minutes} mins`;
}

function getNotificationTypeMeta(type: NotificationType) {
  switch (type) {
    case "happening_now":
      return {
        label: "Happening Now",
        icon: Zap,
        accentBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
        headerIconBg: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
      };
    case "upcoming_30m":
      return {
        label: "Upcoming Alert",
        icon: Clock,
        accentBg: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
        headerIconBg: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
      };
    case "today_summary":
      return {
        label: "Daily Agenda Summary",
        icon: Calendar,
        accentBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
        headerIconBg: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
      };
  }
}

export function NotificationDetailModal() {
  const {
    selectedNotification,
    closeNotificationModal,
    deleteNotification,
    markAsRead,
    markAsUnread,
  } = useNotifications();

  const { formatTime } = useSettings();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle ESC key press & scroll locking
  useEffect(() => {
    if (!selectedNotification) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeNotificationModal();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [selectedNotification, closeNotificationModal]);

  if (!selectedNotification || !mounted) return null;

  const item: NotificationItem = selectedNotification;
  const meta = getNotificationTypeMeta(item.type);
  const IconComponent = meta.icon;
  const durationStr = formatDuration(item.startTime, item.endTime);

  const formattedTimestamp = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(item.timestamp));

  const formattedEventDate = item.date
    ? new Intl.DateTimeFormat("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(new Date(`${item.date}T00:00:00`))
    : null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="notification-modal-title"
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
    >
      {/* Backdrop */}
      <div
        onClick={closeNotificationModal}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg rounded-xl border border-border bg-card text-card-foreground shadow-2xl z-10 animate-in fade-in zoom-in-98 duration-150 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-border/80 bg-muted/25 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div
              className={cn(
                "size-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 border border-border/50",
                meta.headerIconBg
              )}
            >
              <IconComponent className="size-4.5" />
            </div>

            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={cn(
                    "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border",
                    meta.accentBg
                  )}
                >
                  <IconComponent className="size-2.5" />
                  {meta.label}
                </span>

                {item.eventType && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground border border-border">
                    {item.eventType === "calendar_item" ? (
                      <>
                        <CalendarDays className="size-2.5" />
                        Calendar Event
                      </>
                    ) : (
                      <>
                        <Layers className="size-2.5" />
                        Routine Timetable
                      </>
                    )}
                  </span>
                )}

                <span
                  className={cn(
                    "inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-medium border",
                    item.read
                      ? "bg-muted/40 text-muted-foreground border-border/60"
                      : "bg-primary/10 text-primary border-primary/20"
                  )}
                >
                  {item.read ? "Read" : "New / Unread"}
                </span>
              </div>

              <h2
                id="notification-modal-title"
                className="text-sm sm:text-base font-semibold text-foreground tracking-tight leading-snug break-words"
              >
                {item.title}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={closeNotificationModal}
            aria-label="Close modal"
            className="size-7 rounded-md p-0 flex items-center justify-center text-muted-foreground/70 hover:text-foreground hover:bg-muted/70 transition-colors cursor-pointer shrink-0"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
          {/* Main Notification Message Card */}
          <div className="p-3.5 rounded-lg bg-muted/40 border border-border/70 text-foreground leading-relaxed flex items-start gap-2.5">
            <Info className="size-4 text-primary shrink-0 mt-0.5 opacity-80" />
            <p className="text-xs text-foreground/90 font-normal leading-relaxed">
              {item.message}
            </p>
          </div>

          {/* Event Time & Schedule Information */}
          {(item.startTime || item.date || item.endTime) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {item.startTime && (
                <div className="p-3 rounded-lg bg-muted/30 border border-border/60 space-y-1">
                  <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                    <Clock3 className="size-3.5 text-primary opacity-80" />
                    <span>Scheduled Time</span>
                  </div>
                  <p className="font-semibold text-foreground text-xs font-mono">
                    {formatTime(item.startTime)}
                    {item.endTime && ` — ${formatTime(item.endTime)}`}
                  </p>
                </div>
              )}

              {durationStr && (
                <div className="p-3 rounded-lg bg-muted/30 border border-border/60 space-y-1">
                  <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                    <Sparkles className="size-3.5 text-amber-500 opacity-80" />
                    <span>Duration</span>
                  </div>
                  <p className="font-semibold text-foreground text-xs">
                    {durationStr}
                  </p>
                </div>
              )}

              {formattedEventDate && (
                <div className="p-3 rounded-lg bg-muted/30 border border-border/60 space-y-1 sm:col-span-2">
                  <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                    <CalendarCheck2 className="size-3.5 text-primary opacity-80" />
                    <span>Event Date</span>
                  </div>
                  <p className="font-semibold text-foreground text-xs">
                    {formattedEventDate}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Event Description (if provided) */}
          {item.description && (
            <div className="p-3.5 rounded-lg bg-muted/25 border border-border/60 space-y-1.5">
              <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] font-medium">
                <FileText className="size-3.5 text-muted-foreground" />
                <span>Description</span>
              </div>
              <p className="text-xs text-foreground/85 leading-relaxed whitespace-pre-wrap">
                {item.description}
              </p>
            </div>
          )}

          {/* Detailed Agenda Sub-items for Today's Summary */}
          {item.items && item.items.length > 0 && (
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <CalendarDays className="size-3.5 text-primary" />
                  <span>Scheduled Agenda ({item.items.length} item{item.items.length !== 1 ? "s" : ""})</span>
                </h3>
              </div>

              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-0.5">
                {item.items.map((sub, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors border border-border/60 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="size-1.5 rounded-full bg-primary shrink-0" />
                      <span className="font-medium text-foreground truncate text-xs">
                        {sub.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {sub.startTime && (
                        <span className="font-mono text-[11px] font-medium text-muted-foreground bg-background px-2 py-0.5 rounded border border-border/60">
                          {formatTime(sub.startTime)}
                          {sub.endTime && ` – ${formatTime(sub.endTime)}`}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timestamp & Alert Metadata */}
          <div className="pt-2 border-t border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-muted-foreground">
            <span>Alert generated:</span>
            <span className="font-medium text-foreground/80 font-mono">
              {formattedTimestamp}
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3 sm:p-4 border-t border-border bg-muted/20 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={() => {
                deleteNotification(item.id);
                closeNotificationModal();
              }}
              className="h-7.5 px-2.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive border-border hover:border-destructive/30 rounded-md font-medium cursor-pointer transition-colors"
              title="Delete this notification"
            >
              <Trash2 className="size-3.5 mr-1" />
              <span>Delete</span>
            </Button>

            {item.read ? (
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={() => markAsUnread(item.id)}
                className="h-7.5 px-2.5 text-xs text-muted-foreground hover:text-foreground rounded-md font-medium cursor-pointer transition-colors"
                title="Mark as unread"
              >
                <RotateCcw className="size-3 mr-1" />
                <span>Mark Unread</span>
              </Button>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={() => markAsRead(item.id)}
                className="h-7.5 px-2.5 text-xs text-primary hover:bg-primary/10 rounded-md font-medium cursor-pointer transition-colors"
                title="Mark as read"
              >
                <CheckCheck className="size-3.5 mr-1" />
                <span>Mark Read</span>
              </Button>
            )}
          </div>

          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={closeNotificationModal}
            className="h-7.5 px-4 text-xs font-medium rounded-md shadow-2xs cursor-pointer"
          >
            Close
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default NotificationDetailModal;
