import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query"
import { z } from "zod"

import { apiClient } from "@/lib/api/client"
import { useQuery } from "@/lib/api/use-query"

import { type REPORT_PERIODS, reportSchema } from "./schemas"

export const reportKeys = { all: ["reports"] as const }

export const reportsQuery = queryOptions({
  queryKey: reportKeys.all,
  queryFn: () => apiClient.get("/reports", { schema: z.array(reportSchema) }),
})

export function useReports() {
  return useQuery(reportsQuery)
}

export function useGenerateReport() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: {
      id: string
      period: (typeof REPORT_PERIODS)[number]
      format: "PDF" | "CSV"
    }) => apiClient.post(`/reports/${input.id}/generate`, { schema: reportSchema, body: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: reportKeys.all }),
  })
}
