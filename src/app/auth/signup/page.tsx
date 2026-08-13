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
        <div className="flex min-h-svh flex-col justify-between px-6 py-8 sm:px-10 lg:px-16 xl:px-20">
          {/* Header & Logo */}
          <div className="flex items-center justify-between">
            <Image
              src="/habi_logo_landscape.png"
              alt="Habi Logo"
              width={800}
              height={800}
              priority
              className="h-16 w-auto object-contain"
            />

            {/* Step Progress Indicator */}
            <div className="flex items-center gap-2 text-xs font-semibold">
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border transition-all ${
                step === 1 ? "border-primary bg-primary/10 text-primary" : "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              }`}>
                {step > 1 ? <Check className="size-3.5" /> : <ShieldCheck className="size-3.5" />}
                <span>1. Account</span>
              </div>

              <div className="w-4 h-px bg-border" />

              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border transition-all ${
                step === 2 ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
              }`}>
                <User className="size-3.5" />
                <span>2. Profile</span>
              </div>
            </div>
          </div>

          {/* Form Content */}
          <div className="flex items-center justify-center py-6">
            <div className="w-full max-w-md">
              {step === 1 ? (
                <>
                  <div className="mb-8 space-y-2">
                    <h1 className="text-4xl font-bold tracking-tight">
                      Create your account
                    </h1>
                    <p className="text-sm text-muted-foreground">
                      Start organizing your schedules and plans with Habi.
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

                  <p className="mt-6 text-center text-xs leading-relaxed text-muted-foreground">
                    By creating an account, you agree to our{" "}
                    <Link
                      href="/terms"
                      className="font-medium text-foreground underline underline-offset-4 hover:text-primary"
                    >
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link
                      href="/privacy"
                      className="font-medium text-foreground underline underline-offset-4 hover:text-primary"
                    >
                      Privacy Policy
                    </Link>
                    .
                  </p>
                </>
              ) : (
                <>
                  <div className="mb-8 space-y-2">
                    <h1 className="text-4xl font-bold tracking-tight">
                      Complete your profile
                    </h1>
                    <p className="text-sm text-muted-foreground">
                      Set up your avatar, username, and time zone to finish.
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
                <Link href="/auth/login" className="font-semibold text-primary underline underline-offset-4">
                  Log in
                </Link>
              </p>
            ) : (
              <button
                type="button"
                onClick={() => router.replace("/dashboard")}
                className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4"
              >
                Skip for now and go to Dashboard
              </button>
            )}
          </div>
        </div>

        {/* Right Section: Visual Banner */}
        <div className="relative hidden overflow-hidden lg:block">
          <Image
            src="/sdad.png"
            alt="Habi"
            fill
            priority
            className="object-cover"
          />

          <div className="absolute inset-0 bg-black/20" />

          <div className="absolute inset-x-0 bottom-0 p-12 text-white xl:p-16">
            <div className="max-w-lg">
              <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-white/70">
                Habi
              </p>

              <h2 className="text-4xl font-semibold leading-tight xl:text-5xl">
                {step === 1 ? (
                  <>
                    Build better habits.
                    <br />
                    Plan your days.
                  </>
                ) : (
                  <>
                    Welcome aboard!
                    <br />
                    Let's set up your profile.
                  </>
                )}
              </h2>

              <p className="mt-5 max-w-md text-sm leading-6 text-white/75">
                {step === 1
                  ? "Keep your schedules, tasks, and plans organized in one simple workspace."
                  : "Personalize your profile image, handle, and timezone preferences."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </ProfileProvider>
  );
}
