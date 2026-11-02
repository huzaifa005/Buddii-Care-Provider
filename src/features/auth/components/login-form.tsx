"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, EyeOff, Lock } from "lucide-react"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
import { Controller, useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Spinner } from "@/components/ui/spinner"
import { siteConfig } from "@/config/site"
import { ApiError } from "@/lib/api/client"
import { safeRedirectPath } from "@/lib/auth/redirect"

import { useLogin } from "../api"
import { type LoginInput, loginSchema } from "../schemas"

export function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const login = useLogin()
  const [showPassword, setShowPassword] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })

  const onSubmit = form.handleSubmit(async (input) => {
    setFormError(null)
    try {
      await login.mutateAsync(input)
      router.replace(safeRedirectPath(params.get("next")))
    } catch (error) {
      // One generic message: never reveal whether the email exists.
      setFormError(
        error instanceof ApiError && error.status < 500
          ? "Email or password is incorrect."
          : "We couldn't sign you in right now. Please try again.",
      )
      form.resetField("password")
    }
  })

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 flex flex-col items-center text-center">
        <span className="mb-6 rounded-2xl bg-sidebar px-5 py-4">
          <Image
            src="/brand/buddii-logo.svg"
            alt="Buddii"
            width={122}
            height={35}
            priority
            unoptimized
          />
        </span>
        <h1 className="text-2xl font-semibold tracking-tight text-heading">Sign in</h1>
        <p className="mt-1 text-sm text-muted-foreground">{siteConfig.name}</p>
      </div>

      <form
        onSubmit={onSubmit}
        // POST so credentials never land in the URL if the page has not hydrated yet.
        method="post"
        noValidate
        className="space-y-5 rounded-panel surface p-6"
      >
        {formError && (
          <p
            role="alert"
            className="rounded-lg bg-destructive-soft px-3 py-2.5 text-sm text-destructive-foreground"
          >
            {formError}
          </p>
        )}
        <Controller
          control={form.control}
          name="email"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="login-email">Work email</FieldLabel>
              <Input
                id="login-email"
                type="email"
                autoComplete="username"
                autoFocus
                className="h-10"
                aria-invalid={fieldState.invalid}
                {...field}
              />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="password"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="login-password">Password</FieldLabel>
              <InputGroup className="h-10">
                <InputGroupInput
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  aria-invalid={fieldState.invalid}
                  {...field}
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    size="icon-xs"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff /> : <Eye />}
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
        <Button type="submit" className="h-10 w-full rounded-lg" disabled={login.isPending}>
          {login.isPending && <Spinner />}
          Sign in
        </Button>
        {/* TODO(auth): password reset is owned by the Django auth flow; link once the URL is agreed. */}
        <p className="text-center text-xs text-muted-foreground">
          Forgotten your password? Contact your Provider Administrator.
        </p>
      </form>

      <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <Lock className="size-3" aria-hidden />
        Authorised users only. Activity is audited.
      </p>
    </div>
  )
}
