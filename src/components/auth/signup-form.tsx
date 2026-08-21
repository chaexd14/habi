"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Loader2, ArrowRight } from "lucide-react";

export interface SignupFormProps extends React.ComponentProps<"form"> {
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  errors: {
    email?: string[];
    password?: string[];
    form?: string;
  };
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export function SignupForm({
  className,
  email,
  setEmail,
  password,
  setPassword,
  errors,
  loading,
  onSubmit,
  ...props
}: SignupFormProps) {
  return (
    <form className={cn("flex flex-col gap-3.5", className)} onSubmit={onSubmit} {...props}>
      <FieldGroup className="space-y-3.5">
        {errors.form && (
          <div
            role="alert"
            aria-live="polite"
            className="rounded-md bg-destructive/10 border border-destructive/20 p-2.5 text-xs text-destructive font-medium"
          >
            {errors.form}
          </div>
        )}

        <Field>
          <FieldLabel htmlFor="signup_email" className="text-xs font-medium">Email address</FieldLabel>
          <Input
            id="signup_email"
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
          {errors.email?.length ? (
            <FieldError errors={errors.email.map((msg) => ({ message: msg }))} />
          ) : (
            <FieldDescription className="text-[11px] text-muted-foreground">
              We&apos;ll use this to confirm your account.
            </FieldDescription>
          )}
        </Field>

        <Field>
          <FieldLabel htmlFor="signup_password" className="text-xs font-medium">Password</FieldLabel>
          <Input
            id="signup_password"
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            required
            className="h-8.5 rounded-md"
            aria-invalid={!!errors.password?.length}
          />
          {errors.password?.length ? (
            <FieldError errors={errors.password.map((msg) => ({ message: msg }))} />
          ) : (
            <FieldDescription className="text-[11px] text-muted-foreground">
              At least 8 characters, one uppercase, and one number.
            </FieldDescription>
          )}
        </Field>

        <Field className="pt-1">
          <Button
            type="submit"
            disabled={loading}
            className="h-8.5 font-medium text-xs w-full rounded-md shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                Creating Account...
              </>
            ) : (
              <>
                <span>Continue to Profile</span>
                <ArrowRight className="size-3.5" />
              </>
            )}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
}

export default SignupForm;
