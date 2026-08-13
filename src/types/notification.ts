export type NotificationType = "today_summary" | "happening_now" | "upcoming_30m";

export type EventSourceType = "calendar_item" | "schedule_item";

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  eventId?: string;
  eventType?: EventSourceType;
  startTime?: string | null; // HH:mm
  endTime?: string | null;   // HH:mm
  items?: { title: string; startTime?: string | null; endTime?: string | null }[];
  timestamp: string;         // ISO date time
  read: boolean;
}

export interface NotificationState {
  notifications: NotificationItem[];
  unreadCount: number;
  permissionGranted: boolean;
}
