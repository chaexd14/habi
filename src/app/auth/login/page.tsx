"use client";

import { useState, Suspense } from "react";
import createClient from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { LoginCredentials } from "@/types/auth";
import { LoginSchema } from "@/lib/validations/auth";
import { recordSessionStart } from "@/lib/auth/session";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Loader2, AlertCircle, ArrowRight, Clock } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isExpired = searchParams.get("expired") === "1" || searchParams.get("expired") === "true";
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

      // Initialize 8-hour session lifetime
      recordSessionStart(Date.now());

      router.replace("/dashboard");
    } catch (err) {
      console.error("Login error:", err);
      setErrors({ form: "An unexpected error occurred. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm space-y-5">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Welcome back
        </h1>
        <p className="text-xs text-muted-foreground">
          Sign in to your schedules, calendars, and routines.
        </p>
      </div>

      {isExpired && (
        <div
          role="status"
          className="rounded-md bg-amber-500/10 border border-amber-500/20 p-3 text-xs text-amber-600 dark:text-amber-400 font-medium flex items-start gap-2.5"
        >
          <Clock className="size-4 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-semibold">Session expired</p>
            <p className="text-[11px] opacity-90">
              For security, you have been automatically logged out after 8 hours. Please sign in again.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-3.5">
        <FieldGroup className="space-y-3.5">
          {errors.form && (
            <div
              role="alert"
              aria-live="polite"
              className="rounded-md bg-destructive/10 border border-destructive/20 p-2.5 text-xs text-destructive font-medium flex items-center gap-2"
            >
              <AlertCircle className="size-3.5 shrink-0" />
              <span>{errors.form}</span>
            </div>
          )}

          <Field>
            <FieldLabel htmlFor="email" className="text-xs font-medium">Email address</FieldLabel>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
              className="h-8.5 rounded-md"
              aria-invalid={!!errors.email?.length}
            />
            {errors.email?.length && (
              <FieldError errors={errors.email.map((msg) => ({ message: msg }))} />
            )}
          </Field>

          <Field>
            <div className="flex items-center justify-between">
              <FieldLabel htmlFor="password" className="text-xs font-medium">Password</FieldLabel>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
              className="h-8.5 rounded-md"
              aria-invalid={!!errors.password?.length}
            />
            {errors.password?.length && (
              <FieldError errors={errors.password.map((msg) => ({ message: msg }))} />
            )}
          </Field>

          <Field className="pt-1">
            <Button
              type="submit"
              disabled={loading}
              className="h-8.5 w-full font-medium text-xs rounded-md shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="size-3.5" />
                </>
              )}
            </Button>
          </Field>
        </FieldGroup>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-svh bg-background lg:grid lg:grid-cols-2">
      {/* Left Section: Login Form */}
      <div className="flex min-h-svh flex-col justify-between px-6 py-8 sm:px-12 lg:px-16 xl:px-20">
        {/* Header & Logo */}
        <div className="flex items-center justify-between">
          <Link href="/" className="inline-block" aria-label="Habi Home">
            <Image
              src="/habi_logo_landscape.png"
              alt="Habi Logo"
              width={800}
              height={800}
              priority
              className="h-12 w-auto object-contain"
            />
          </Link>
        </div>

        {/* Main Content */}
        <div className="flex items-center justify-center py-8">
          <Suspense fallback={<div className="w-full max-w-sm space-y-5 animate-pulse" />}>
            <LoginForm />
          </Suspense>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground">
          <p>
            Don&apos;t have an account?{" "}
            <Link
              href="/auth/signup"
              className="font-medium text-foreground underline underline-offset-4 hover:opacity-80"
            >
              Create account
            </Link>
          </p>
        </div>
      </div>

      {/* Right Section: Minimalist Editorial Showcase */}
      <div className="relative hidden overflow-hidden lg:block bg-muted border-l border-border">
        <Image
          src="/sdad.png"
          alt="Habi Workspace"
          fill
          priority
          className="object-cover opacity-85 dark:opacity-75"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />

        <div className="absolute inset-x-0 bottom-0 p-10 text-white xl:p-14">
          <div className="max-w-md space-y-2.5">
            <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider bg-white/20 backdrop-blur-xs border border-white/20 text-white">
              Minimalist Scheduling
            </span>

            <h2 className="text-2xl font-semibold leading-tight text-white">
              Stay synchronized with your daily routines.
            </h2>

            <p className="text-xs leading-relaxed text-white/80">
              Manage calendars, recurring weekly schedules, and time blocks in one unified workspace.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}