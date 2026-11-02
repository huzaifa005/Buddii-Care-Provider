import { queryOptions } from "@tanstack/react-query"

import { apiClient } from "@/lib/api/client"
import { useQuery } from "@/lib/api/use-query"

import { dashboardSummarySchema } from "./schemas"

export const homeKeys = {
  all: ["home"] as const,
  summary: () => [...homeKeys.all, "summary"] as const,
}

/** One aggregated call for the Home screen, so the dashboard renders in a single round trip. */
export const dashboardSummaryQuery = queryOptions({
  queryKey: homeKeys.summary(),
  queryFn: () => apiClient.get("/dashboard/summary", { schema: dashboardSummarySchema }),
})

export function useDashboardSummary() {
  return useQuery(dashboardSummaryQuery)
}
