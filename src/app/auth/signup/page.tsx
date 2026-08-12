"use client";

import { useState } from "react";
import createClient from "@/lib/supabase/client";
import type { SignupCredentials } from "@/types/auth";
import { SignUpSchema } from "@/lib/validations/auth";

export default function SignupPage() {
  const supabase = createClient();

  const [email, setEmail] =
    useState<SignupCredentials["email"]>("");

  const [password, setPassword] =
    useState<SignupCredentials["password"]>("");

  const [errors, setErrors] = useState<{
    email?: string[];
    password?: string[];
  }>({});

  const [loading, setLoading] = useState(false);

  async function handleSignup() {
    setErrors({});
    setLoading(true);

    try {
      const result = SignUpSchema.safeParse({
        email,
        password,
      });

      if (!result.success) {
        setErrors(result.error.flatten().fieldErrors);
        return;
      }

      const validatedEmail = result.data.email
        .trim()
        .toLowerCase();

      const { data, error } = await supabase.auth.signUp({
        email: validatedEmail,
        password: result.data.password,
      });

      if (error) {
        console.error("Signup error:", error);

        setErrors({
          email: [error.message],
        });

        return;
      }
      
      if (
        data.user &&
        data.user.identities &&
        data.user.identities.length === 0
      ) {
        setErrors({
          email: [
            "This email is already registered.",
          ],
        });

        return;
      }

      console.log(
        "Signup successful. Check your email."
      );
    } catch (error) {
      console.error("Unexpected signup error:", error);

      setErrors({
        email: [
          "Something went wrong. Please try again.",
        ],
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md space-y-4">
      {/* Email */}
      <div>
        <label
          htmlFor="email"
          className="mb-1 block"
        >
          Email
        </label>

        <input
          id="email"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);

            // Clear email error when typing
            if (errors.email) {
              setErrors((prev) => ({
                ...prev,
                email: undefined,
              }));
            }
          }}
          className="w-full rounded-md border p-2"
          disabled={loading}
        />

        {errors.email?.map((error) => (
          <p
            key={error}
            className="mt-1 text-sm text-red-500"
          >
            {error}
          </p>
        ))}
      </div>

      {/* Password */}
      <div>
        <label
          htmlFor="password"
          className="mb-1 block"
        >
          Password
        </label>

        <input
          id="password"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);

            // Clear password error when typing
            if (errors.password) {
              setErrors((prev) => ({
                ...prev,
                password: undefined,
              }));
            }
          }}
          className="w-full rounded-md border p-2"
          disabled={loading}
        />

        {errors.password?.map((error) => (
          <p
            key={error}
            className="mt-1 text-sm text-red-500"
          >
            {error}
          </p>
        ))}
      </div>

      {/* Submit */}
      <button
        type="button"
        onClick={handleSignup}
        disabled={loading}
        className="rounded-md bg-black px-4 py-2 text-white disabled:opacity-50"
      >
        {loading
          ? "Creating account..."
          : "Sign up"}
      </button>
    </div>
  );
}
