"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import {
  AppSettings,
  DEFAULT_SETTINGS,
  TimeFormat,
} from "@/types/settings";

const SETTINGS_STORAGE_KEY = "habi_settings_v1";

interface SettingsContextType {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  resetSettings: () => void;
  formatTime: (timeStrOrHour?: string | number | null, formatOverride?: TimeFormat) => string;
  formatTimeRange: (
    startTime?: string | null,
    endTime?: string | null,
    formatOverride?: TimeFormat
  ) => string;
}

const SettingsContext = createContext<SettingsContextType>({
  settings: DEFAULT_SETTINGS,
  updateSettings: () => {},
  resetSettings: () => {},
  formatTime: () => "",
  formatTimeRange: () => "",
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          return {
            timeFormat: parsed.timeFormat === "24h" ? "24h" : "12h",
            notificationAlert: [10, 15, 30, 60].includes(parsed.notificationAlert)
              ? parsed.notificationAlert
              : DEFAULT_SETTINGS.notificationAlert,
          };
        }
      } catch (err) {
        console.error("Failed to load settings from localStorage:", err);
      }
    }
    return DEFAULT_SETTINGS;
  });

  // Sync to localStorage
  const saveSettings = useCallback((newSettings: AppSettings) => {
    setSettings(newSettings);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
      } catch (err) {
        console.error("Failed to save settings to localStorage:", err);
      }
    }
  }, []);

  const updateSettings = useCallback(
    (partial: Partial<AppSettings>) => {
      saveSettings({
        ...settings,
        ...partial,
      });
    },
    [settings, saveSettings]
  );

  const resetSettings = useCallback(() => {
    saveSettings(DEFAULT_SETTINGS);
  }, [saveSettings]);

  // Format a time string (e.g. "14:30") or float hour (e.g. 14.5) to formatted 12h or 24h
  const formatTime = useCallback(
    (timeStrOrHour?: string | number | null, formatOverride?: TimeFormat): string => {
      if (timeStrOrHour === null || timeStrOrHour === undefined || timeStrOrHour === "") {
        return "";
      }

      const activeFormat = formatOverride || settings.timeFormat;

      let h = 0;
      let m = 0;

      if (typeof timeStrOrHour === "string") {
        const parts = timeStrOrHour.split(":");
        if (parts.length >= 2) {
          h = parseInt(parts[0], 10);
          m = parseInt(parts[1], 10);
        } else {
          return timeStrOrHour;
        }
      } else {
        h = Math.floor(timeStrOrHour);
        m = Math.round((timeStrOrHour - Math.floor(timeStrOrHour)) * 60);
      }

      if (isNaN(h)) return "";
      if (isNaN(m)) m = 0;

      const normalizedH = ((h % 24) + 24) % 24;
      const padM = m.toString().padStart(2, "0");

      if (activeFormat === "24h") {
        const padH = normalizedH.toString().padStart(2, "0");
        return `${padH}:${padM}`;
      }

      // 12-hour format
      const period = normalizedH >= 12 ? "PM" : "AM";
      const h12 = normalizedH % 12 === 0 ? 12 : normalizedH % 12;
      return `${h12}:${padM} ${period}`;
    },
    [settings.timeFormat]
  );

  const formatTimeRange = useCallback(
    (
      startTime?: string | null,
      endTime?: string | null,
      formatOverride?: TimeFormat
    ): string => {
      if (!startTime) return "";
      const startStr = formatTime(startTime, formatOverride);
      if (!endTime) return startStr;
      const endStr = formatTime(endTime, formatOverride);
      return `${startStr} – ${endStr}`;
    },
    [formatTime]
  );

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSettings,
        resetSettings,
        formatTime,
        formatTimeRange,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
