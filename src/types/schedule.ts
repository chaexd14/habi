export type DayOfWeek = "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN";

export type Schedule = {
  id: string;
  user_id?: string;
  title: string;
  description?: string | null;
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
  data: ScheduleItem[];
};
