import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query"

import { homeKeys } from "@/features/home/api"
import { residentKeys } from "@/features/residents/api"
import { apiClient } from "@/lib/api/client"
import { useQuery } from "@/lib/api/use-query"

import {
  type ActivityFilter,
  activityListSchema,
  activityRecordSchema,
  type ProviderResponseInput,
} from "./schemas"

export const activityKeys = {
  all: ["activity"] as const,
  list: (filter: ActivityFilter, residentId?: string) =>
    [...activityKeys.all, "list", { filter, residentId }] as const,
}

export const activityListQuery = (filter: ActivityFilter, residentId?: string) =>
  queryOptions({
    queryKey: activityKeys.list(filter, residentId),
    queryFn: () =>
      apiClient.get("/activity", {
        schema: activityListSchema,
        query: { filter, resident: residentId },
      }),
  })

export function useActivity(filter: ActivityFilter, residentId?: string) {
  return useQuery(activityListQuery(filter, residentId))
}

export function useRecordResponse() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ProviderResponseInput }) =>
      apiClient.post(`/activity/${id}/response`, { schema: activityRecordSchema, body: input }),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: activityKeys.all }),
        queryClient.invalidateQueries({ queryKey: residentKeys.all }),
        queryClient.invalidateQueries({ queryKey: homeKeys.all }),
      ]),
  })
}
