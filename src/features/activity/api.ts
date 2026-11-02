import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query"

import { clientKeys } from "@/features/clients/api"
import { homeKeys } from "@/features/home/api"
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
  list: (filter: ActivityFilter, clientId?: string) =>
    [...activityKeys.all, "list", { filter, clientId }] as const,
}

export const activityListQuery = (filter: ActivityFilter, clientId?: string) =>
  queryOptions({
    queryKey: activityKeys.list(filter, clientId),
    queryFn: () =>
      apiClient.get("/activity", {
        schema: activityListSchema,
        query: { filter, client: clientId },
      }),
  })

export function useActivity(filter: ActivityFilter, clientId?: string) {
  return useQuery(activityListQuery(filter, clientId))
}

export function useRecordResponse() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ProviderResponseInput }) =>
      apiClient.post(`/activity/${id}/response`, { schema: activityRecordSchema, body: input }),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: activityKeys.all }),
        queryClient.invalidateQueries({ queryKey: clientKeys.all }),
        queryClient.invalidateQueries({ queryKey: homeKeys.all }),
      ]),
  })
}
