export type TimeFormat = "12h" | "24h";

export type NotificationAlertMinutes = 10 | 15 | 30 | 60;

export interface AppSettings {
  timeFormat: TimeFormat;
  notificationAlert: NotificationAlertMinutes;
}

export const DEFAULT_SETTINGS: AppSettings = {
  timeFormat: "12h",
  notificationAlert: 30,
};

export const NOTIFICATION_ALERT_OPTIONS: {
  value: NotificationAlertMinutes;
  label: string;
  shortLabel: string;
  description: string;
}[] = [
  {
    value: 10,
    label: "10 minutes before",
    shortLabel: "10 min",
    description: "Quick heads-up right before start",
  },
  {
    value: 15,
    label: "15 minutes before",
    shortLabel: "15 min",
    description: "Recommended for quick transitions",
  },
  {
    value: 30,
    label: "30 minutes before",
    shortLabel: "30 min",
    description: "Default standard reminder window",
  },
  {
    value: 60,
    label: "1 hour before",
    shortLabel: "1 hour",
    description: "Early prep reminder for long routines",
  },
];
