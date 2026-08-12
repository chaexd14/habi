import * as z from "zod";

export const CreateScheduleSchema = z.object({
  title: z.string().min(1, "Schedule title is required"),
  description: z.string().optional(),
});

export const UpdateScheduleSchema = CreateScheduleSchema.partial();

export type CreateScheduleSchema = z.infer<typeof CreateScheduleSchema>;
export type UpdateScheduleSchema = z.infer<typeof UpdateScheduleSchema>;