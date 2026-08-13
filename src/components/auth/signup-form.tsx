import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { Loader2 } from "lucide-react"

export interface SignupFormProps extends React.ComponentProps<"form"> {
  email: string
  setEmail: (email: string) => void
  password: string
  setPassword: (password: string) => void
  errors: {
    email?: string[]
    password?: string[]
    form?: string
  }
  loading: boolean
  onSubmit: (e: React.FormEvent) => void
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
    <form className={cn("flex flex-col gap-6", className)} onSubmit={onSubmit} {...props}>
      <FieldGroup>
        {errors.form && (
          <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive font-medium">
            {errors.form}
          </div>
        )}

        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            type="email"
            placeholder="m@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            required
            className="bg-background h-12"
            aria-invalid={!!errors.email?.length}
          />
          {errors.email?.length ? (
            <FieldError errors={errors.email.map((msg) => ({ message: msg }))} />
          ) : (
            <FieldDescription>
              We&apos;ll use this to contact you. We will not share your email
              with anyone else.
            </FieldDescription>
          )}
        </Field>

        <Field>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            required
            className="bg-background h-12"
            aria-invalid={!!errors.password?.length}
          />
          {errors.password?.length ? (
            <FieldError errors={errors.password.map((msg) => ({ message: msg }))} />
          ) : (
            <FieldDescription>
              Must contain at least 8 characters, one uppercase letter, and a number.
            </FieldDescription>
          )}
        </Field>

        <Field>
          <Button type="submit" disabled={loading} className="h-12 font-bold w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Account...
              </>
            ) : (
              "Create Account"
            )}
          </Button>
        </Field>

        <Field>
          <FieldDescription className="px-6 text-center">
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="font-medium text-foreground underline underline-offset-4 hover:text-primary"
            >
              Sign in
            </Link>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  )
}

