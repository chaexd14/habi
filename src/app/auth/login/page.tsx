"use client";

import { useState } from "react";
import createClient from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { LoginCredentials } from "@/types/auth";
import { LoginSchema } from "@/lib/validations/auth";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] =
    useState<LoginCredentials["email"]>("");

  const [password, setPassword] =
    useState<LoginCredentials["password"]>("");

  const [errors, setErrors] = useState<{
    email?: string[];
    password?: string[];
    form?: string;
  }>({});

  async function handleLogin() {
    setErrors({});

    // Zod Validation
    const result = LoginSchema.safeParse({
      email,
      password,
    });

    if (!result.success) {
      setErrors(result.error.flatten().fieldErrors);
      return;
    }

    // Supabase Authentication
    const { error } = await supabase.auth.signInWithPassword({
      email: result.data.email,
      password: result.data.password,
    });

    if (error) {
      setErrors({
        form: "Invalid email or password.",
      });

      return;
    }

    const { data } = await supabase.auth.getSession()

    console.log(data.session?.access_token)

    router.replace("/dashboard");
  }

  return (
    <div className="space-y-4">
      <div>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-md border p-2"
        />

        {errors.email?.map((error) => (
          <p
            key={error}
            className="text-sm text-red-500"
          >
            {error}
          </p>
        ))}
      </div>

      <div>
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-md border p-2"
        />

        {errors.password?.map((error) => (
          <p
            key={error}
            className="text-sm text-red-500"
          >
            {error}
          </p>
        ))}
      </div>

      {errors.form && (
        <p className="text-sm text-red-500">
          {errors.form}
        </p>
      )}

      <button
        type="button"
        onClick={handleLogin}
        className="rounded-md bg-black px-4 py-2 text-white disabled:opacity-50"
      >
        Log in
      </button>
    </div>
  );
}