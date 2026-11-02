import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query"

import { apiClient } from "@/lib/api/client"
import { useQuery } from "@/lib/api/use-query"

import { type NewReferral, referralListSchema, referralSchema } from "./schemas"

export const referralKeys = {
  all: ["referrals"] as const,
}

export const referralListQuery = () =>
  queryOptions({
    queryKey: referralKeys.all,
    queryFn: () => apiClient.get("/referrals", { schema: referralListSchema }),
  })

export function useReferrals() {
  return useQuery(referralListQuery())
}

export function useSubmitReferral() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: NewReferral) =>
      apiClient.post("/referrals", { schema: referralSchema, body: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: referralKeys.all }),
  })
}
