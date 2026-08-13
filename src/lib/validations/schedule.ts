import * as z from "zod";

export const CreateScheduleSchema = z.object({
  title: z.string().min(1, "Schedule title is required"),
  description: z.string().optional().nullable(),
  start_date: z.string().optional().nullable(),
  end_date: z.string().optional().nullable(),
});

export const UpdateScheduleSchema = CreateScheduleSchema.partial();

export type CreateScheduleSchema = z.infer<typeof CreateScheduleSchema>;
export type UpdateScheduleSchema = z.infer<typeof UpdateScheduleSchema>;