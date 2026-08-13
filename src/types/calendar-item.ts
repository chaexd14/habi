export type CalendarItem = {
  id: string;
  user_id?: string;
  category_id?: string | null;
  title: string;
  description?: string | null;
  day: string; // YYYY-MM-DD format
  start_time?: string | null; // HH:mm format
  end_time?: string | null; // HH:mm format
  created_at?: string;
  updated_at?: string;
};

export type CalendarItemResponse = {
  success: boolean;
  message?: string;
  error?: string;
  data: CalendarItem[];
};
