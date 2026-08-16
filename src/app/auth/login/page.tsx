"use client";

import { useState } from "react";
import createClient from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { LoginCredentials } from "@/types/auth";
import { LoginSchema } from "@/lib/validations/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Loader2, AlertCircle, Sparkles } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState<LoginCredentials["email"]>("");
  const [password, setPassword] = useState<LoginCredentials["password"]>("");
  const [loading, setLoading] = useState(false);

  const [errors, setErrors] = useState<{
    email?: string[];
    password?: string[];
    form?: string;
  }>({});

  async function handleLogin(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
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

      router.replace("/dashboard");
    } catch (err) {
      console.error("Login error:", err);
      setErrors({ form: "An unexpected error occurred. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-svh bg-background lg:grid lg:grid-cols-2">
      {/* Left Section: Login Form */}
      <div className="flex min-h-svh flex-col justify-between px-6 py-8 sm:px-10 lg:px-16 xl:px-20">
        {/* Header & Logo */}
        <div className="flex items-center justify-between">
          <Link href="/" className="inline-block">
            <Image
              src="/habi_logo_landscape.png"
              alt="Habi Logo"
              width={800}
              height={800}
              priority
              className="h-16 w-auto object-contain"
            />
          </Link>
        </div>

        {/* Main Content */}
        <div className="flex items-center justify-center py-8">
          <div className="w-full max-w-md space-y-6">
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                Welcome back
              </h1>
              <p className="text-sm text-muted-foreground">
                Enter your credentials to access your schedules and tasks.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <FieldGroup className="space-y-4">
                {errors.form && (
                  <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive font-medium flex items-center gap-2">
                    <AlertCircle className="size-4 shrink-0" />
                    <span>{errors.form}</span>
                  </div>
                )}

                <Field>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    required
                    className="h-11"
                    aria-invalid={!!errors.email?.length}
                  />
                  {errors.email?.length && (
                    <FieldError errors={errors.email.map((msg) => ({ message: msg }))} />
                  )}
                </Field>

                <Field>
                  <div className="flex items-center justify-between">
                    <FieldLabel htmlFor="password">Password</FieldLabel>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    required
                    className="h-11"
                    aria-invalid={!!errors.password?.length}
                  />
                  {errors.password?.length && (
                    <FieldError errors={errors.password.map((msg) => ({ message: msg }))} />
                  )}
                </Field>

                <Field className="pt-2">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="h-11 w-full font-bold shadow-xs"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </Button>
                </Field>
              </FieldGroup>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground">
          <p>
            Don&apos;t have an account?{" "}
            <Link
              href="/auth/signup"
              className="font-semibold text-primary underline underline-offset-4 hover:opacity-90"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>

      {/* Right Section: Visual Showcase */}
      <div className="relative hidden overflow-hidden lg:block">
        <Image
          src="/sdad.png"
          alt="Habi Workspace"
          fill
          priority
          className="object-cover"
        />

        <div className="absolute inset-0 bg-black/25" />

        <div className="absolute inset-x-0 bottom-0 p-12 text-white xl:p-16">
          <div className="max-w-lg space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="size-3 text-amber-300" />
              <span>Smart Habit Scheduling</span>
            </div>

            <h2 className="text-3xl font-semibold leading-tight xl:text-4xl text-white">
              Stay synchronized with your daily routines.
            </h2>

            <p className="max-w-md text-sm leading-6 text-white/80">
              Manage calendars, recurring weekly schedules, and conflicts in one unified minimalist workspace.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}