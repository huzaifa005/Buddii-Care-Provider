import { queryOptions } from "@tanstack/react-query"

import { type EntitlementCode, hasEntitlement } from "@/features/entitlements/entitlements"
import { apiClient } from "@/lib/api/client"
import { useQuery } from "@/lib/api/use-query"

import { can, type Capability } from "./permissions"
import { sessionSchema } from "./schemas"

export const sessionKeys = {
  all: ["session"] as const,
}

export const sessionQuery = queryOptions({
  queryKey: sessionKeys.all,
  queryFn: () => apiClient.get("/me", { schema: sessionSchema }),
  staleTime: 5 * 60 * 1000,
})

export function useSession() {
  return useQuery(sessionQuery)
}

/** UI-level check only. Never treat this as access control; the API enforces entitlements. */
export function useHasEntitlement(code: EntitlementCode) {
  const { data } = useSession()
  return data ? hasEntitlement(data.entitlements, code) : false
}

/**
 * Whether the signed-in user's role allows an action, for showing or hiding controls.
 * False while the session loads, so restricted controls never flash in.
 */
export function useCan(capability: Capability) {
  const { data } = useSession()
  return data ? can(data.user.role, capability) : false
}
