import { useMutation, useQueryClient } from "@tanstack/react-query"
import { z } from "zod"

import { sessionKeys } from "@/features/session/api"
import { apiClient } from "@/lib/api/client"

import { type LoginInput } from "./schemas"

/** Django session login: the API sets the httpOnly session and CSRF cookies. */
export function useLogin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: LoginInput) =>
      apiClient.post("/auth/login", { schema: z.undefined(), body: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: sessionKeys.all }),
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => apiClient.post("/auth/logout", { schema: z.undefined(), body: {} }),
    // Drop every cached record so nothing from this session survives in memory.
    onSettled: () => queryClient.clear(),
  })
}
