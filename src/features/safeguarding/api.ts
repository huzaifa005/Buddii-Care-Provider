import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query"
import { z } from "zod"

import { homeKeys } from "@/features/home/api"
import { apiClient } from "@/lib/api/client"
import { useQuery } from "@/lib/api/use-query"

import { concernSchema, type NewConcern } from "./schemas"

export const safeguardingKeys = { all: ["safeguarding"] as const }

export const concernsQuery = queryOptions({
  queryKey: safeguardingKeys.all,
  queryFn: () => apiClient.get("/safeguarding/concerns", { schema: z.array(concernSchema) }),
})

export function useConcerns() {
  return useQuery(concernsQuery)
}

export function useReportConcern() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: NewConcern) =>
      apiClient.post("/safeguarding/concerns", { schema: concernSchema, body: input }),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: safeguardingKeys.all }),
        queryClient.invalidateQueries({ queryKey: homeKeys.all }),
      ]),
  })
}
