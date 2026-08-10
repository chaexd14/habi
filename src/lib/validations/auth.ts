import * as z from "zod";

export const SignUpSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /[A-Z]/,
      "Password must contain at least 1 uppercase letter"
    )
    .regex(
      /[0-9]/,
      "Password must contain at least 1 number"
    ),
});

export const LoginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),

  password: z
    .string()
    .min(1, "Password is required"),
});

export type SignUpInput = z.infer<typeof SignUpSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;