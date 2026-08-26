import * as z from "zod";

export const CreateScheduleItemSchema = z.object({
  schedule_id: z.string().uuid("Invalid schedule ID"),
  category_id: z.string().uuid("Invalid category ID").nullable().optional(),

  title: z.string().min(1, "Title is required"),

  days: z
    .array(
      z.enum(["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"])
    )
    .min(1, "At least one day is required"),

  start_time: z.string().min(1, "Start time is required"),
  end_time: z.string().min(1, "End time is required"),
  allow_conflict: z.boolean().optional(),
});

export const UpdateScheduleItemSchema = CreateScheduleItemSchema.partial();

export type CreateScheduleItemInput = z.infer<typeof CreateScheduleItemSchema>;
export type UpdateScheduleItemInput = z.infer<typeof UpdateScheduleItemSchema>;