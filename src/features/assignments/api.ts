import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query"

import { homeKeys } from "@/features/home/api"
import { apiClient } from "@/lib/api/client"
import { useQuery } from "@/lib/api/use-query"

import {
  type AssignmentStatus,
  assignmentListSchema,
  assignmentSchema,
  type ConfirmAssignmentInput,
  type DeclineAssignmentInput,
} from "./schemas"

export const assignmentKeys = {
  all: ["assignments"] as const,
  list: (status: AssignmentStatus) => [...assignmentKeys.all, "list", status] as const,
}

export const assignmentListQuery = (status: AssignmentStatus) =>
  queryOptions({
    queryKey: assignmentKeys.list(status),
    queryFn: () =>
      apiClient.get("/assignments", { schema: assignmentListSchema, query: { status } }),
  })

export function useAssignments(status: AssignmentStatus) {
  return useQuery(assignmentListQuery(status))
}

type Decision =
  | { id: string; decision: "confirm"; input: ConfirmAssignmentInput }
  | { id: string; decision: "decline"; input: DeclineAssignmentInput }

export function useRespondToAssignment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, decision, input }: Decision) =>
      apiClient.post(`/assignments/${id}/${decision}`, { schema: assignmentSchema, body: input }),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: assignmentKeys.all }),
        queryClient.invalidateQueries({ queryKey: homeKeys.all }),
      ]),
  })
}
