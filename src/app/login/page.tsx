import type { Metadata } from "next"
import { Suspense } from "react"

import { Skeleton } from "@/components/ui/skeleton"
import { LoginForm } from "@/features/auth/components/login-form"

export const metadata: Metadata = { title: "Sign in" }

export default function LoginPage() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-4 py-12">
      <Suspense fallback={<Skeleton className="h-96 w-full max-w-sm rounded-panel" />}>
        <LoginForm />
      </Suspense>
    </main>
  )
}
