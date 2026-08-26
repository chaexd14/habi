export type DayOfWeek = "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN";

export type Schedule = {
  id: string;
  user_id?: string;
  title: string;
  description?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type ScheduleItem = {
  id: string;
  schedule_id: string;
  category_id?: string | null;
  title: string;
  days: DayOfWeek[];
  start_time: string;
  end_time: string;
  created_at?: string;
  updated_at?: string;
};

export type ScheduleConflict = {
  id: string;
  title: string;
  schedule_id: string;
  schedule_title?: string;
  overlapping_days: string[];
  start_time: string;
  end_time: string;
};

export type ConflictType =
  | "routine_overlap"
  | "routine_vs_calendar"
  | "calendar_vs_routine"
  | "calendar_vs_calendar";

export type ConflictDetail = {
  id: string;
  conflictType: ConflictType;
  title: string;
  sourceType: "schedule_item" | "calendar_item";
  sourceTitle?: string; // e.g. "Work Week (Planned Schedule)" or "Single Calendar Event"
  scheduleId?: string;
  scheduleTitle?: string;
  date?: string; // e.g. "2026-09-01"
  days?: DayOfWeek[]; // e.g. ["MON", "WED"]
  start_time: string;
  end_time: string;
  message?: string;
};

export type ScheduleResponse = {
  success: boolean;
  message?: string;
  error?: string;
  data: Schedule[];
};

export type ScheduleItemResponse = {
  success: boolean;
  message?: string;
  error?: string;
  conflicts?: ConflictDetail[];
  data: ScheduleItem[];
};

