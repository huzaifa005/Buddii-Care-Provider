import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query"

import { apiClient } from "@/lib/api/client"
import { useQuery } from "@/lib/api/use-query"

import { actionListSchema, type ActionReplyInput, actionSchema } from "./schemas"

export const actionKeys = { all: ["action-centre"] as const }

export const actionsQuery = queryOptions({
  queryKey: actionKeys.all,
  queryFn: () => apiClient.get("/action-centre/actions", { schema: actionListSchema }),
})

export function useActions() {
  return useQuery(actionsQuery)
}

/** Open actions for the sidebar badge. */
export function useOpenActionCount() {
  const { data } = useQuery(actionsQuery)
  return data?.filter((a) => a.status === "OPEN").length ?? 0
}

export function useReplyToAction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ActionReplyInput }) =>
      apiClient.post(`/action-centre/actions/${encodeURIComponent(id)}/reply`, {
        body: input,
        schema: actionSchema,
      }),
    // A reply with files also adds resident documents, so refresh those as well.
    onSuccess: () => queryClient.invalidateQueries(),
  })
}
