"use client"

import { useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

import { setUnauthorizedHandler } from "@/lib/api/query-client"
import { loginPath } from "@/lib/auth/redirect"

/**
 * When any request comes back 401 (expired or revoked session), clear cached data and send
 * the user to sign in, remembering where they were.
 */
export function UnauthorizedRedirect() {
  const router = useRouter()
  const queryClient = useQueryClient()

  useEffect(() => {
    setUnauthorizedHandler(() => {
      const here = `${window.location.pathname}${window.location.search}`
      if (here.startsWith("/login")) return
      queryClient.clear()
      router.replace(loginPath(here))
    })
    return () => setUnauthorizedHandler(undefined)
  }, [router, queryClient])

  return null
}
