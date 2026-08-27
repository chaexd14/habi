"use client";

import * as React from "react";
import { useNotifications } from "@/providers/notification-provider";
import { BellRing, Calendar, Clock, Zap, X } from "lucide-react";
import { NotificationType } from "@/types/notification";

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
          30m
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

export function NotificationToastListener() {
  const { toastNotification, dismissToast, openNotificationModal } = useNotifications();

  if (!toastNotification) return null;

  return (
    <div
      role="alert"
      tabIndex={0}
      aria-live="polite"
      aria-label={`Notification: ${toastNotification.title}. Click to view details.`}
      onClick={() => openNotificationModal(toastNotification)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openNotificationModal(toastNotification);
        }
      }}
      className="fixed top-3 right-3 z-[100] max-w-sm w-full bg-card border border-border/80 shadow-2xl rounded-xl p-3.5 flex items-start gap-3 animate-in slide-in-from-top-2 duration-150 cursor-pointer hover:border-primary/40 hover:bg-muted/30 transition-all select-none group"
    >
      <div className="p-2 rounded-lg bg-muted text-foreground shrink-0 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
        <BellRing className="size-4" />
      </div>
      <div className="flex-1 min-w-0 space-y-0.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
            {toastNotification.title}
          </span>
          {getNotificationBadge(toastNotification.type)}
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
          {toastNotification.message}
        </p>
        <p className="text-[10px] text-primary font-medium pt-0.5 opacity-80 group-hover:opacity-100 transition-opacity">
          Click to view full details
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
  );
}

export default NotificationToastListener;
