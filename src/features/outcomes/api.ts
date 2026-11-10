import { queryOptions } from "@tanstack/react-query"

import { apiClient } from "@/lib/api/client"
import { useQuery } from "@/lib/api/use-query"

import { outcomesAssessmentsSchema, outcomesSummarySchema } from "./schemas"

export const outcomesQuery = queryOptions({
  queryKey: ["outcomes", "summary"],
  queryFn: () => apiClient.get("/outcomes/summary", { schema: outcomesSummarySchema }),
})

export function useOutcomes() {
  return useQuery(outcomesQuery)
}

export const outcomesAssessmentsQuery = queryOptions({
  queryKey: ["outcomes", "assessments"],
  queryFn: () => apiClient.get("/outcomes/assessments", { schema: outcomesAssessmentsSchema }),
})

/** Outcomes v2: WEMWBS and UCLA from Council-verified assessments. */
export function useOutcomeAssessments() {
  return useQuery(outcomesAssessmentsQuery)
}
