import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query"
import { z } from "zod"

import { residentKeys } from "@/features/residents/api"
import { apiClient } from "@/lib/api/client"
import { useQuery } from "@/lib/api/use-query"

import {
  assessmentRecordSchema,
  type NewAssessment,
  type NewDocument,
  residentDocumentSchema,
} from "./schemas"

export const recordKeys = {
  assessments: (residentId: string) => [...residentKeys.detail(residentId), "assessments"] as const,
  documents: (residentId: string) => [...residentKeys.detail(residentId), "documents"] as const,
}

const path = (residentId: string, part: string) =>
  `/residents/${encodeURIComponent(residentId)}/${part}`

export const assessmentsQuery = (residentId: string) =>
  queryOptions({
    queryKey: recordKeys.assessments(residentId),
    queryFn: () =>
      apiClient.get(path(residentId, "assessments"), { schema: z.array(assessmentRecordSchema) }),
  })

export const documentsQuery = (residentId: string) =>
  queryOptions({
    queryKey: recordKeys.documents(residentId),
    queryFn: () =>
      apiClient.get(path(residentId, "documents"), { schema: z.array(residentDocumentSchema) }),
  })

export function useAssessments(residentId: string) {
  return useQuery(assessmentsQuery(residentId))
}

export function useDocuments(residentId: string) {
  return useQuery(documentsQuery(residentId))
}

export function useSubmitAssessment(residentId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: NewAssessment) =>
      apiClient.post(path(residentId, "assessments"), {
        schema: assessmentRecordSchema,
        body: input,
      }),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: recordKeys.assessments(residentId) }),
        queryClient.invalidateQueries({ queryKey: recordKeys.documents(residentId) }),
      ]),
  })
}

export function useUploadDocument(residentId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: NewDocument) =>
      apiClient.post(path(residentId, "documents"), {
        schema: residentDocumentSchema,
        body: input,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: recordKeys.documents(residentId) }),
  })
}
