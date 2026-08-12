import * as z from "zod";

export const CreateCategorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  color: z.string(),
});


export const UpdateCategorySchema = CreateCategorySchema.partial();

export type CreateCategorySchema = z.infer<typeof CreateCategorySchema>;
export type UpdateCategorySchema = z.infer<typeof UpdateCategorySchema>;