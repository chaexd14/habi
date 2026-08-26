"use client";

import * as React from "react";
import { useState } from "react";
import { useNotifications } from "@/providers/notification-provider";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  Bell,
  CheckCheck,
  Trash2,
  Calendar,
  Clock,
  Zap,
  Volume2,
  Inbox,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NotificationType } from "@/types/notification";
import { useSettings } from "@/providers/settings-provider";

export interface NotificationSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function getNotificationBadge(type: NotificationType) {
  switch (type) {
    case "happening_now":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
          <Zap className="size-2.5" />
          Now
        </span>
      );
    case "upcoming_30m":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shrink-0">
          <Clock className="size-2.5" />
          Alert
        </span>
      );
    case "today_summary":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0">
          <Calendar className="size-2.5" />
          Today
        </span>
      );
  }
}

export function NotificationSheet({ open, onOpenChange }: NotificationSheetProps) {
  const { formatTime } = useSettings();
  const {
    notifications,
    unreadCount,
    permission,
    requestPermission,
    markAsRead,
    markAllAsRead,
    clearNotifications,
  } = useNotifications();

  const [activeFilter, setActiveFilter] = useState<"all" | "unread">("all");

  const filteredNotifications =
    activeFilter === "unread"
      ? notifications.filter((n) => !n.read)
      : notifications;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md p-0 flex flex-col h-full bg-card border-l border-border"
      >
        {/* Header */}
        <SheetHeader className="p-4 pb-3 border-b border-border space-y-3 bg-muted/20">
          <div className="flex items-center justify-between pr-8">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                <Bell className="size-4" />
              </div>
              <div>
                <SheetTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <span>Notifications</span>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary text-primary-foreground">
                      {unreadCount} new
                    </span>
                  )}
                </SheetTitle>
                <SheetDescription className="text-[11px] text-muted-foreground">
                  Stay updated on upcoming events and daily routines.
                </SheetDescription>
              </div>
            </div>
          </div>

          {/* Quick Action Toolbar */}
          <div className="flex items-center justify-between pt-1">
            {/* Filter segmented buttons */}
            <div
              role="radiogroup"
              aria-label="Filter notifications"
              className="flex items-center gap-0.5 bg-muted/60 p-0.5 rounded-md border border-border"
            >
              <button
                type="button"
                role="radio"
                aria-checked={activeFilter === "all"}
                onClick={() => setActiveFilter("all")}
                className={cn(
                  "px-2.5 py-1 text-[11px] font-medium rounded transition-colors cursor-pointer",
                  activeFilter === "all"
                    ? "bg-background text-foreground shadow-2xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                All ({notifications.length})
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={activeFilter === "unread"}
                onClick={() => setActiveFilter("unread")}
                className={cn(
                  "px-2.5 py-1 text-[11px] font-medium rounded transition-colors cursor-pointer",
                  activeFilter === "unread"
                    ? "bg-background text-foreground shadow-2xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Unread ({unreadCount})
              </button>
            </div>

            {/* Batch actions */}
            {notifications.length > 0 && (
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={markAllAsRead}
                    className="h-7 text-xs px-2 text-muted-foreground hover:text-foreground rounded-md cursor-pointer font-medium"
                    title="Mark all notifications as read"
                  >
                    <CheckCheck className="size-3.5 mr-1" />
                    <span>Read all</span>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={clearNotifications}
                  className="size-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md cursor-pointer"
                  title="Clear all notifications"
                  aria-label="Clear all notifications"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            )}
          </div>
        </SheetHeader>

        {/* Audio Notification Permission Banner */}
        {permission !== "granted" && permission !== "unsupported" && (
          <div className="px-4 py-2.5 bg-muted/40 border-b border-border flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-muted-foreground min-w-0 text-xs">
              <Volume2 className="size-4 shrink-0 text-primary" />
              <span className="truncate leading-tight">Enable chime sound alerts?</span>
            </div>
            <Button
              variant="outline"
              size="xs"
              className="h-6.5 text-[11px] font-medium rounded shrink-0 cursor-pointer shadow-2xs"
              onClick={requestPermission}
            >
              Enable
            </Button>
          </div>
        )}

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto divide-y divide-border/60 p-2 space-y-1">
          {filteredNotifications.length === 0 ? (
            <div className="h-full min-h-[300px] flex flex-col items-center justify-center p-6 text-center text-muted-foreground space-y-2">
              <div className="size-12 rounded-full bg-muted/50 flex items-center justify-center border border-border">
                {activeFilter === "unread" ? (
                  <CheckCheck className="size-6 text-muted-foreground/60" />
                ) : (
                  <Inbox className="size-6 text-muted-foreground/60" />
                )}
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-foreground">
                  {activeFilter === "unread" ? "No unread notifications" : "No notifications"}
                </p>
                <p className="text-[11px] text-muted-foreground max-w-xs leading-relaxed">
                  {activeFilter === "unread"
                    ? "You're all caught up! Check back later for upcoming reminders."
                    : "You will receive alerts for upcoming events and recurring timetable routines."}
                </p>
              </div>
            </div>
          ) : (
            filteredNotifications.map((item) => (
              <div
                key={item.id}
                role="button"
                tabIndex={0}
                onClick={() => markAsRead(item.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    markAsRead(item.id);
                  }
                }}
                className={cn(
                  "p-3 rounded-lg flex items-start gap-3 cursor-pointer transition-all hover:bg-muted/60 focus-visible:bg-muted/70 focus-visible:outline-none border border-transparent",
                  !item.read ? "bg-muted/30 border-border/50 font-normal" : "opacity-75 hover:opacity-100"
                )}
              >
                <div
                  className={cn(
                    "size-2 rounded-full mt-1.5 shrink-0 transition-colors",
                    !item.read ? "bg-primary" : "bg-muted-foreground/30"
                  )}
                  aria-hidden="true"
                />

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-medium text-foreground truncate">
                      {item.title}
                    </p>
                    {getNotificationBadge(item.type)}
                  </div>

                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {item.message}
                  </p>

                  {item.items && item.items.length > 0 && (
                    <div className="mt-2 bg-muted/50 p-2.5 rounded-md border border-border/60 space-y-1">
                      {item.items.map((sub, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-[11px] text-foreground"
                        >
                          <span className="truncate font-medium">• {sub.title}</span>
                          {sub.startTime && (
                            <span className="text-[10px] text-muted-foreground font-mono ml-2 shrink-0 bg-background px-1.5 py-0.5 rounded border border-border/50">
                              {formatTime(sub.startTime)}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="pt-0.5 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-muted-foreground/70">
                      {new Date(item.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {!item.read && (
                      <span className="text-[10px] text-primary font-medium">Mark read</span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-border bg-muted/20 flex items-center justify-between text-xs text-muted-foreground">
          <span className="text-[11px]">
            {notifications.length} total notification{notifications.length !== 1 ? "s" : ""}
          </span>
          <Button
            type="button"
            variant="outline"
            size="xs"
            onClick={() => onOpenChange(false)}
            className="h-7 text-xs font-medium rounded-md cursor-pointer"
          >
            Close
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default NotificationSheet;
