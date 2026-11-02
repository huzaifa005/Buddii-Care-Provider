import { queryOptions } from "@tanstack/react-query"

import { apiClient } from "@/lib/api/client"
import { useQuery } from "@/lib/api/use-query"

import { outcomesSummarySchema } from "./schemas"

export const outcomesQuery = queryOptions({
  queryKey: ["outcomes", "summary"],
  queryFn: () => apiClient.get("/outcomes/summary", { schema: outcomesSummarySchema }),
})

export function useOutcomes() {
  return useQuery(outcomesQuery)
}
