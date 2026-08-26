import * as z from "zod";

export const BaseScheduleSchema = z.object({
  title: z.string().min(1, "Schedule title is required"),
  description: z.string().optional().nullable(),
  start_date: z.string().optional().nullable(),
  end_date: z.string().optional().nullable(),
});

export const CreateScheduleSchema = BaseScheduleSchema.refine(
  (data) => {
    if (data.start_date && data.end_date) {
      return data.end_date >= data.start_date;
    }
    return true;
  },
  {
    message: "End date must be on or after start date",
    path: ["end_date"],
  }
);

export const UpdateScheduleSchema = BaseScheduleSchema.partial().refine(
  (data) => {
    if (data.start_date && data.end_date) {
      return data.end_date >= data.start_date;
    }
    return true;
  },
  {
    message: "End date must be on or after start date",
    path: ["end_date"],
  }
);

export type CreateScheduleSchema = z.infer<typeof CreateScheduleSchema>;
export type UpdateScheduleSchema = z.infer<typeof UpdateScheduleSchema>;
