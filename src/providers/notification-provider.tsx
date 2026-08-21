"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { NotificationItem } from "@/types/notification";
import { getCalendarItems } from "@/lib/api/calendar-item";
import { getScheduleItems } from "@/lib/api/schedule-item";
import { getSchedules } from "@/lib/api/schedule";
import { CalendarItem } from "@/types/calendar-item";
import { Schedule, ScheduleItem } from "@/types/schedule";
import { evaluateNotifications } from "@/lib/utils/notification-checker";
import { useProfile } from "@/providers/profile-provider";

const STORAGE_KEY = "habi_notifications_v1";
const NOTIFIED_KEYS_STORAGE_KEY = "habi_notified_keys_v1";

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  permission: NotificationPermission | "unsupported";
  toastNotification: NotificationItem | null;
  dismissToast: () => void;
  requestPermission: () => Promise<boolean>;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  permission: "unsupported",
  toastNotification: null,
  dismissToast: () => {},
  requestPermission: async () => false,
  markAsRead: () => {},
  markAllAsRead: () => {},
  clearNotifications: () => {},
  refreshNotifications: async () => {},
});

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { userProfile } = useProfile();
  
  // Lazy state initialization
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const storedNotifs = localStorage.getItem(STORAGE_KEY);
        return storedNotifs ? JSON.parse(storedNotifs) : [];
      } catch {
        return [];
      }
    }
    return [];
  });

  const [toastNotification, setToastNotification] = useState<NotificationItem | null>(null);

  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(() => {
    if (typeof window !== "undefined") {
      return "Notification" in window ? Notification.permission : "unsupported";
    }
    return "unsupported";
  });

  const calendarItemsRef = useRef<CalendarItem[]>([]);
  const scheduleItemsRef = useRef<ScheduleItem[]>([]);
  const schedulesRef = useRef<Schedule[]>([]);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Synchronously load notified keys set from localStorage to prevent re-notifying on page reload
  const notifiedKeysRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const storedKeys = localStorage.getItem(NOTIFIED_KEYS_STORAGE_KEY);
        if (storedKeys) {
          notifiedKeysRef.current = new Set(JSON.parse(storedKeys));
        }
      } catch (e) {
        console.error("Failed to load notified keys from storage", e);
      }
    }
  }, []);

  // Sync notifications to localStorage
  const saveNotifications = useCallback((items: NotificationItem[]) => {
    setNotifications(items);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      } catch (e) {
        console.error("Failed to save notifications to localStorage", e);
      }
    }
  }, []);

  // Request browser notification permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setPermission("unsupported");
      return false;
    }

    try {
      const res = await Notification.requestPermission();
      setPermission(res);
      return res === "granted";
    } catch (e) {
      console.error("Error requesting notification permission", e);
      return false;
    }
  }, []);

  const triggerToast = useCallback((item: NotificationItem) => {
    setToastNotification(item);
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = setTimeout(() => {
      setToastNotification(null);
    }, 6000);
  }, []);

  const dismissToast = useCallback(() => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToastNotification(null);
  }, []);

  // Evaluate notifications using current data
  const checkNotifications = useCallback(
    (calItems: CalendarItem[], schedItems: ScheduleItem[], scheds: Schedule[]) => {
      const result = evaluateNotifications(
        calItems,
        schedItems,
        scheds,
        notifiedKeysRef.current,
        new Date()
      );

      if (result.newNotifications.length > 0) {
        // Persist notified keys set in localStorage
        notifiedKeysRef.current = result.notifiedKeys;
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(
              NOTIFIED_KEYS_STORAGE_KEY,
              JSON.stringify(Array.from(notifiedKeysRef.current))
            );
          } catch (e) {
            console.error("Failed to save notified keys to localStorage", e);
          }
        }

        // Trigger browser popups & toasts ONLY for newly discovered notifications
        result.newNotifications.forEach((nItem) => {
          if (
            typeof window !== "undefined" &&
            "Notification" in window &&
            Notification.permission === "granted"
          ) {
            try {
              new Notification(nItem.title, {
                body: nItem.message,
                icon: "/favicon.ico",
              });
            } catch (err) {
              console.error("Failed to trigger browser notification", err);
            }
          }
        });

        // Show top toast banner for the primary new alert
        triggerToast(result.newNotifications[0]);

        // Prepend to stored notifications list
        setNotifications((prevNotifs) => {
          const updated = [...result.newNotifications, ...prevNotifs];
          if (typeof window !== "undefined") {
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            } catch (e) {
              console.error(e);
            }
          }
          return updated;
        });
      }
    },
    [triggerToast]
  );

  // Fetch data and evaluate
  const refreshNotifications = useCallback(async () => {
    try {
      const [calRes, schedItemsRes, schedRes] = await Promise.all([
        getCalendarItems(),
        getScheduleItems(),
        getSchedules(),
      ]);

      if (calRes.success && Array.isArray(calRes.data)) {
        calendarItemsRef.current = calRes.data;
      }
      if (schedItemsRes.success && Array.isArray(schedItemsRes.data)) {
        scheduleItemsRef.current = schedItemsRes.data;
      }
      if (schedRes.success && Array.isArray(schedRes.data)) {
        schedulesRef.current = schedRes.data;
      }

      checkNotifications(
        calendarItemsRef.current,
        scheduleItemsRef.current,
        schedulesRef.current
      );
    } catch (err) {
      console.error("Failed to fetch data for notifications:", err);
    }
  }, [checkNotifications]);

  // Trigger notifications immediately upon user login / profile load
  useEffect(() => {
    if (userProfile?.id) {
      refreshNotifications();
    }
  }, [userProfile?.id, refreshNotifications]);

  // Periodic loop (check every 30 seconds)
  useEffect(() => {
    refreshNotifications();
    const interval = setInterval(() => {
      if (calendarItemsRef.current.length > 0 || scheduleItemsRef.current.length > 0) {
        checkNotifications(
          calendarItemsRef.current,
          scheduleItemsRef.current,
          schedulesRef.current
        );
      } else {
        refreshNotifications();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [refreshNotifications, checkNotifications]);

  const markAsRead = useCallback(
    (id: string) => {
      saveNotifications(
        notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    },
    [notifications, saveNotifications]
  );

  const markAllAsRead = useCallback(() => {
    saveNotifications(notifications.map((n) => ({ ...n, read: true })));
  }, [notifications, saveNotifications]);

  const clearNotifications = useCallback(() => {
    saveNotifications([]);
  }, [saveNotifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        permission,
        toastNotification,
        dismissToast,
        requestPermission,
        markAsRead,
        markAllAsRead,
        clearNotifications,
        refreshNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
