import * as z from "zod";

export const CreateProfileSchema = z.object({
  user_name: z.string().min(1, "User name is required"),
  avatar_url: z.string().url(),
  time_zone: z.string(),
  role: z.enum(["ADMIN", "USER"]).default("USER"),
})

export const UpdateProfileSchema = CreateProfileSchema.partial()

export type CreateProfileInput = z.infer<typeof CreateProfileSchema>
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>
