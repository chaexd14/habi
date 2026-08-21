"use client";

import { useState } from "react";
import createClient from "@/lib/supabase/client";
import type { SignupCredentials } from "@/types/auth";
import { SignUpSchema } from "@/lib/validations/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

import { SignupForm } from "@/components/auth/signup-form";
import { CreateUserProfile } from "@/components/user-profile/create-user-profile";
import { ProfileProvider } from "@/providers/profile-provider";
import { Check, User, ShieldCheck } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState<SignupCredentials["email"]>("");
  const [password, setPassword] = useState<SignupCredentials["password"]>("");

  const [errors, setErrors] = useState<{
    email?: string[];
    password?: string[];
    form?: string;
  }>({});

  const [loading, setLoading] = useState(false);

  async function handleSignup(e?: React.FormEvent) {
    if (e) {
      e.preventDefault();
    }
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

      const validatedEmail = result.data.email.trim().toLowerCase();

      const { data, error } = await supabase.auth.signUp({
        email: validatedEmail,
        password: result.data.password,
        options: {
          emailRedirectTo: `${typeof window !== "undefined" ? window.location.origin : ""}/dashboard`,
        },
      });

      if (error) {
        console.error("Signup error:", error);
        setErrors({
          form: error.message,
        });
        return;
      }

      if (data.user && data.user.identities && data.user.identities.length === 0) {
        setErrors({
          email: ["This email is already registered."],
        });
        return;
      }

      // Proceed directly to Step 2: Create Profile
      setStep(2);
    } catch (error) {
      console.error("Unexpected signup error:", error);
      setErrors({
        form: "Something went wrong. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }

  const handleProfileSuccess = () => {
    router.replace("/dashboard");
  };

  return (
    <ProfileProvider>
      <div className="min-h-svh bg-background lg:grid lg:grid-cols-2">
        {/* Left Section: Signup / Profile Creation */}
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

            {/* Step Progress Indicator */}
            <div className="flex items-center gap-1.5 text-xs font-medium">
              <div
                className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[11px] transition-colors ${
                  step === 1
                    ? "border-foreground bg-foreground text-background font-medium"
                    : "border-border bg-muted text-muted-foreground"
                }`}
              >
                {step > 1 ? <Check className="size-3" /> : <ShieldCheck className="size-3" />}
                <span>1. Account</span>
              </div>

              <div className="w-2 h-px bg-border" />

              <div
                className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[11px] transition-colors ${
                  step === 2
                    ? "border-foreground bg-foreground text-background font-medium"
                    : "border-border text-muted-foreground opacity-50"
                }`}
              >
                <User className="size-3" />
                <span>2. Profile</span>
              </div>
            </div>
          </div>

          {/* Form Content */}
          <div className="flex items-center justify-center py-6">
            <div className="w-full max-w-sm">
              {step === 1 ? (
                <>
                  <div className="mb-5 space-y-1">
                    <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                      Create your account
                    </h1>
                    <p className="text-xs text-muted-foreground">
                      Start organizing your schedules and daily routines.
                    </p>
                  </div>

                  <SignupForm
                    email={email}
                    setEmail={setEmail}
                    password={password}
                    setPassword={setPassword}
                    errors={errors}
                    loading={loading}
                    onSubmit={handleSignup}
                  />

                  <p className="mt-5 text-center text-xs leading-relaxed text-muted-foreground">
                    By creating an account, you agree to our{" "}
                    <Link
                      href="/terms"
                      className="font-medium text-foreground underline underline-offset-4 hover:opacity-80"
                    >
                      Terms
                    </Link>{" "}
                    and{" "}
                    <Link
                      href="/privacy"
                      className="font-medium text-foreground underline underline-offset-4 hover:opacity-80"
                    >
                      Privacy Policy
                    </Link>
                    .
                  </p>
                </>
              ) : (
                <>
                  <div className="mb-5 space-y-1">
                    <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                      Set up your profile
                    </h1>
                    <p className="text-xs text-muted-foreground">
                      Choose an avatar, display handle, and timezone.
                    </p>
                  </div>

                  <CreateUserProfile onSuccess={handleProfileSuccess} />
                </>
              )}
            </div>
          </div>

          {/* Footer link */}
          <div className="text-center text-xs text-muted-foreground">
            {step === 1 ? (
              <p>
                Already have an account?{" "}
                <Link
                  href="/auth/login"
                  className="font-medium text-foreground underline underline-offset-4 hover:opacity-80"
                >
                  Sign in
                </Link>
              </p>
            ) : (
              <button
                type="button"
                onClick={() => router.replace("/dashboard")}
                className="text-xs font-medium text-muted-foreground hover:text-foreground underline underline-offset-4 cursor-pointer"
              >
                Skip to Dashboard →
              </button>
            )}
          </div>
        </div>

        {/* Right Section: Minimalist Editorial Banner */}
        <div className="relative hidden overflow-hidden lg:block bg-muted border-l border-border">
          <Image
            src="/sdad.png"
            alt="Habi"
            fill
            priority
            className="object-cover opacity-85 dark:opacity-75"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />

          <div className="absolute inset-x-0 bottom-0 p-10 text-white xl:p-14">
            <div className="max-w-md space-y-2.5">
              <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider bg-white/20 backdrop-blur-xs border border-white/20 text-white">
                Seamless Setup
              </span>

              <h2 className="text-2xl font-semibold leading-tight text-white">
                {step === 1 ? (
                  "Build better habits. Plan your days."
                ) : (
                  "Welcome aboard. Personalize your space."
                )}
              </h2>

              <p className="text-xs leading-relaxed text-white/80">
                {step === 1
                  ? "Synchronize your tasks, routines, and schedules in one minimalist workspace."
                  : "Customize your avatar, display handle, and local time settings."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </ProfileProvider>
  );
}
