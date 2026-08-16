"use client";

import * as React from "react";
import { useNotifications } from "@/providers/notification-provider";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Bell,
  BellRing,
  CheckCheck,
  Trash2,
  Calendar,
  Clock,
  Zap,
  X,
  Volume2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NotificationItem, NotificationType } from "@/types/notification";
import { formatTime12h } from "@/lib/utils/notification-checker";

function getNotificationBadge(type: NotificationType) {
  switch (type) {
    case "happening_now":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
          <Zap className="size-2.5 animate-pulse" />
          Happening Now
        </span>
      );
    case "upcoming_30m":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25">
          <Clock className="size-2.5" />
          Starts Soon
        </span>
      );
    case "today_summary":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/25">
          <Calendar className="size-2.5" />
          Today
        </span>
      );
  }
}

export function NotificationBell() {
  const {
    notifications,
    unreadCount,
    permission,
    toastNotification,
    dismissToast,
    requestPermission,
    markAsRead,
    markAllAsRead,
    clearNotifications,
  } = useNotifications();

  return (
    <div className="relative">
      {/* Toast Alert Banner */}
      {toastNotification && (
        <div className="fixed top-4 right-4 z-50 max-w-sm w-full bg-card border border-border shadow-xl rounded-xl p-4 flex items-start gap-3 animate-in slide-in-from-top-4 duration-200">
          <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
            <BellRing className="size-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-foreground truncate">
                {toastNotification.title}
              </span>
              {getNotificationBadge(toastNotification.type)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {toastNotification.message}
            </p>
          </div>
          <button
            onClick={dismissToast}
            className="text-muted-foreground hover:text-foreground transition-colors p-1"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {/* Bell Button & Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="relative" />}>
          <Bell className="size-5 text-foreground" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          className="w-80 sm:w-96 p-0 rounded-xl border border-border/80 bg-card shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-muted/40 border-b border-border/60">
            <div className="flex items-center gap-2">
              <Bell className="size-4 text-primary" />
              <span className="font-semibold text-sm">Notifications</span>
              {unreadCount > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {notifications.length > 0 && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    className="h-7 text-xs px-2 text-muted-foreground hover:text-foreground"
                    title="Mark all as read"
                  >
                    <CheckCheck className="size-3.5 mr-1" />
                    Read all
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearNotifications}
                    className="h-7 text-xs px-2 text-muted-foreground hover:text-destructive"
                    title="Clear notifications"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Desktop Notification Request Prompt */}
          {permission !== "granted" && permission !== "unsupported" && (
            <div className="p-3 bg-primary/5 border-b border-border/50 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Volume2 className="size-4 text-primary shrink-0" />
                <span>Enable desktop alerts for schedules?</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={requestPermission}
              >
                Enable
              </Button>
            </div>
          )}

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-border/40">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                <Bell className="size-8 mx-auto mb-2 opacity-30" />
                <p>No notifications yet</p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  We&apos;ll notify you 30m before events & when schedules start.
                </p>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => markAsRead(item.id)}
                  className={cn(
                    "p-3 flex items-start gap-3 cursor-pointer transition-colors hover:bg-accent/50",
                    !item.read ? "bg-accent/20 font-normal" : "opacity-80"
                  )}
                >
                  <div
                    className={cn(
                      "size-2 rounded-full mt-2 shrink-0",
                      !item.read ? "bg-primary" : "bg-transparent"
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-sm font-medium truncate text-foreground">
                        {item.title}
                      </p>
                      {getNotificationBadge(item.type)}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {item.message}
                    </p>
                    {item.items && item.items.length > 0 && (
                      <div className="mt-2 bg-muted/40 p-2 rounded-lg border border-border/50 space-y-1">
                        {item.items.map((sub, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs font-medium text-foreground">
                            <span className="truncate">• {sub.title}</span>
                            {sub.startTime && (
                              <span className="text-[10px] text-muted-foreground ml-2 shrink-0">
                                {formatTime12h(sub.startTime)}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    <span className="text-[10px] text-muted-foreground/60 mt-1.5 block">
                      {new Date(item.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
