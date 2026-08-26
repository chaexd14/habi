import * as z from "zod";

export const CalendarItemBaseSchema = z.object({
  category_id: z.string().uuid("Invalid category ID").nullable().optional(),
  title: z.string().min(1, "Title is required"),
  description: z.string().nullable().optional(),
  day: z.iso.date("Invalid date"),
  start_time: z.iso.time().nullable().optional(),
  end_time: z.iso.time().nullable().optional(),
  allow_conflict: z.boolean().optional(),
});

export const CreateCalendarItemSchema = CalendarItemBaseSchema.refine(
  (data) => !data.end_time || !data.start_time || data.end_time > data.start_time,
  {
    message: "End time must be later than start time",
    path: ["end_time"],
  }
);

export const UpdateCalendarItemSchema = CalendarItemBaseSchema.partial().refine(
  (data) => !data.end_time || !data.start_time || data.end_time > data.start_time,
  {
    message: "End time must be later than start time",
    path: ["end_time"],
  }
);

export type CreateCalendarItemInput = z.infer<typeof CreateCalendarItemSchema>;
export type UpdateCalendarItemInput = z.infer<typeof UpdateCalendarItemSchema>;