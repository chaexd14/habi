export type NotificationType = "today_summary" | "happening_now" | "upcoming_30m";

export type EventSourceType = "calendar_item" | "schedule_item";

export interface NotificationSubItem {
  title: string;
  startTime?: string | null;
  endTime?: string | null;
  description?: string | null;
  eventType?: EventSourceType;
}

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  description?: string | null;
  eventId?: string;
  eventType?: EventSourceType;
  date?: string;             // YYYY-MM-DD
  startTime?: string | null; // HH:mm
  endTime?: string | null;   // HH:mm
  items?: NotificationSubItem[];
  timestamp: string;         // ISO date time
  read: boolean;
}

export interface NotificationState {
  notifications: NotificationItem[];
  unreadCount: number;
  permissionGranted: boolean;
}

