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
    <form className={cn("flex flex-col gap-5", className)} onSubmit={onSubmit} {...props}>
      <FieldGroup className="space-y-4">
        {errors.form && (
          <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive font-medium">
            {errors.form}
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
          {errors.email?.length ? (
            <FieldError errors={errors.email.map((msg) => ({ message: msg }))} />
          ) : (
            <FieldDescription>
              We&apos;ll use this to contact you. We will not share your email with anyone else.
            </FieldDescription>
          )}
        </Field>

        <Field>
          <FieldLabel htmlFor="password">Password</FieldLabel>
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
          {errors.password?.length ? (
            <FieldError errors={errors.password.map((msg) => ({ message: msg }))} />
          ) : (
            <FieldDescription>
              Must contain at least 8 characters, one uppercase letter, and a number.
            </FieldDescription>
          )}
        </Field>

        <Field className="pt-2">
          <Button type="submit" disabled={loading} className="h-11 font-bold w-full shadow-xs">
            {loading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Creating Account...
              </>
            ) : (
              "Create Account"
            )}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  )
}

