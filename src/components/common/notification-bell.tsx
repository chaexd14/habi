"use client";

import * as React from "react";
import { useNotifications } from "@/providers/notification-provider";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
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
import { NotificationType } from "@/types/notification";
import { useSettings } from "@/providers/settings-provider";

function getNotificationBadge(type: NotificationType) {
  switch (type) {
    case "happening_now":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-muted text-foreground border border-border shrink-0">
          <Zap className="size-2.5" />
          Now
        </span>
      );
    case "upcoming_30m":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-muted text-foreground border border-border shrink-0">
          <Clock className="size-2.5" />
          Alert
        </span>
      );
    case "today_summary":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-muted text-foreground border border-border shrink-0">
          <Calendar className="size-2.5" />
          Today
        </span>
      );
  }
}

export function NotificationBell() {
  const { formatTime } = useSettings();
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
    openNotificationModal,
  } = useNotifications();

  return (
    <div className="relative">
      {/* Toast Alert Banner */}
      {toastNotification && (
        <div
          role="alert"
          tabIndex={0}
          aria-live="polite"
          onClick={() => openNotificationModal(toastNotification)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              openNotificationModal(toastNotification);
            }
          }}
          className="fixed top-3 right-3 z-50 max-w-sm w-full bg-card border border-border/80 shadow-xl rounded-xl p-3.5 flex items-start gap-3 animate-in slide-in-from-top-2 duration-150 cursor-pointer hover:border-primary/40 hover:bg-muted/30 transition-all select-none"
        >
          <div className="p-2 rounded-lg bg-muted text-foreground shrink-0">
            <BellRing className="size-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-foreground truncate">
                {toastNotification.title}
              </span>
              {getNotificationBadge(toastNotification.type)}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              {toastNotification.message}
            </p>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              dismissToast();
            }}
            aria-label="Dismiss notification alert"
            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted cursor-pointer shrink-0"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {/* Bell Trigger Button */}
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              aria-label={unreadCount > 0 ? `Notifications (${unreadCount} unread)` : "Notifications"}
              className="relative size-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors cursor-pointer"
            />
          }
        >
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <span
              className="absolute top-1.5 right-1.5 flex size-3.5 items-center justify-center rounded-full bg-foreground text-[8px] font-semibold text-background"
              aria-hidden="true"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          sideOffset={6}
          className="w-80 sm:w-88 p-0 rounded-lg border border-border bg-popover shadow-lg overflow-hidden animate-in fade-in zoom-in-98 duration-100"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-3.5 py-2.5 bg-muted/30 border-b border-border">
            <div className="flex items-center gap-2">
              <Bell className="size-3.5 text-foreground" />
              <span className="font-semibold text-xs text-foreground">Notifications</span>
              {unreadCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-muted text-muted-foreground font-medium border border-border">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {notifications.length > 0 && (
                <>
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={markAllAsRead}
                    aria-label="Mark all notifications as read"
                    className="h-6 text-[11px] px-2 text-muted-foreground hover:text-foreground rounded cursor-pointer font-medium"
                    title="Mark all as read"
                  >
                    <CheckCheck className="size-3 mr-1" />
                    Read all
                  </Button>
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={clearNotifications}
                    aria-label="Clear all notifications"
                    className="size-6 p-0 text-muted-foreground hover:text-destructive rounded cursor-pointer"
                    title="Clear notifications"
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Sound Permission Request Banner */}
          {permission !== "granted" && permission !== "unsupported" && (
            <div className="p-2.5 bg-muted/40 border-b border-border flex items-center justify-between text-xs gap-2">
              <div className="flex items-center gap-1.5 text-muted-foreground min-w-0 text-[11px]">
                <Volume2 className="size-3.5 shrink-0" />
                <span className="truncate">Enable sound alerts?</span>
              </div>
              <Button
                variant="outline"
                size="xs"
                className="h-6 text-[11px] font-medium rounded shrink-0 cursor-pointer"
                onClick={requestPermission}
              >
                Enable
              </Button>
            </div>
          )}

          {/* Notifications List */}
          <div className="max-h-72 overflow-y-auto divide-y divide-border/60">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground text-xs">
                <p className="font-medium text-foreground text-xs">No notifications</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  You will receive alerts for upcoming events and scheduled routines.
                </p>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => openNotificationModal(item)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      openNotificationModal(item);
                    }
                  }}
                  className={cn(
                    "p-3 flex items-start gap-2.5 cursor-pointer transition-colors hover:bg-muted/50 focus-visible:bg-muted/60 focus-visible:outline-none select-none",
                    !item.read ? "bg-muted/20 font-normal" : "opacity-70"
                  )}
                >
                  <div
                    className={cn(
                      "size-1.5 rounded-full mt-1.5 shrink-0 transition-colors",
                      !item.read ? "bg-foreground" : "bg-transparent"
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <p className="text-xs font-medium truncate text-foreground">
                        {item.title}
                      </p>
                      {getNotificationBadge(item.type)}
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      {item.message}
                    </p>
                    {item.items && item.items.length > 0 && (
                      <div className="mt-1.5 bg-muted/40 p-2 rounded border border-border/50 space-y-0.5">
                        {item.items.map((sub, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between text-[11px] text-foreground"
                          >
                            <span className="truncate">• {sub.title}</span>
                            {sub.startTime && (
                              <span className="text-[10px] text-muted-foreground font-mono ml-2 shrink-0">
                                {formatTime(sub.startTime)}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    <span className="text-[10px] font-mono text-muted-foreground/60 mt-1 block">
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

export default NotificationBell;
