import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query"

import { homeKeys } from "@/features/home/api"
import { apiClient } from "@/lib/api/client"
import { useQuery } from "@/lib/api/use-query"

import {
  type NewSupportRequest,
  type RequestStatus,
  supportRequestListSchema,
  supportRequestSchema,
} from "./schemas"

export const supportRequestKeys = {
  all: ["support-requests"] as const,
  list: (status?: RequestStatus, residentId?: string) =>
    [...supportRequestKeys.all, "list", { status, residentId }] as const,
}

export const supportRequestListQuery = (status?: RequestStatus, residentId?: string) =>
  queryOptions({
    queryKey: supportRequestKeys.list(status, residentId),
    queryFn: () =>
      apiClient.get("/support-requests", {
        schema: supportRequestListSchema,
        query: { status, resident: residentId },
      }),
  })

export function useSupportRequests(status?: RequestStatus, residentId?: string) {
  return useQuery(supportRequestListQuery(status, residentId))
}

function useInvalidateRequests() {
  const queryClient = useQueryClient()
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: supportRequestKeys.all }),
      queryClient.invalidateQueries({ queryKey: homeKeys.all }),
    ])
}

export function useCreateSupportRequest() {
  const invalidate = useInvalidateRequests()
  return useMutation({
    mutationFn: (input: NewSupportRequest) =>
      apiClient.post("/support-requests", { schema: supportRequestSchema, body: input }),
    onSuccess: invalidate,
  })
}

export function useCancelSupportRequest() {
  const invalidate = useInvalidateRequests()
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.post(`/support-requests/${id}/cancel`, { schema: supportRequestSchema, body: {} }),
    onSuccess: invalidate,
  })
}
