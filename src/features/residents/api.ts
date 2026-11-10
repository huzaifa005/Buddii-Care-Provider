import { queryOptions } from "@tanstack/react-query"

import { apiClient } from "@/lib/api/client"
import { paginatedSchema } from "@/lib/api/pagination"
import { useQuery } from "@/lib/api/use-query"

import {
  residentDetailSchema,
  residentDirectorySchema,
  type ResidentListFilters,
  residentSchema,
} from "./schemas"

/** Hierarchical keys so a mutation can invalidate `residentKeys.all` or one resident precisely. */
export const residentKeys = {
  all: ["residents"] as const,
  lists: () => [...residentKeys.all, "list"] as const,
  list: (filters: ResidentListFilters) => [...residentKeys.lists(), filters] as const,
  details: () => [...residentKeys.all, "detail"] as const,
  detail: (id: string) => [...residentKeys.details(), id] as const,
  directory: () => [...residentKeys.all, "directory"] as const,
}

export const residentListQuery = (filters: ResidentListFilters = {}) =>
  queryOptions({
    queryKey: residentKeys.list(filters),
    queryFn: () =>
      apiClient.get("/residents", {
        schema: paginatedSchema(residentSchema),
        query: {
          status: filters.status,
          needs_response: filters.needsResponse,
          awaiting_match: filters.awaitingMatch,
          closed: filters.closed,
          area: filters.area,
          search: filters.search,
          page: filters.page,
        },
      }),
  })

export const residentDetailQuery = (id: string) =>
  queryOptions({
    queryKey: residentKeys.detail(id),
    queryFn: () =>
      apiClient.get(`/residents/${encodeURIComponent(id)}`, { schema: residentDetailSchema }),
  })

export function useResidents(filters: ResidentListFilters = {}, { enabled = true } = {}) {
  return useQuery({ ...residentListQuery(filters), enabled })
}

export function useResident(id: string) {
  return useQuery(residentDetailQuery(id))
}

export const residentDirectoryQuery = () =>
  queryOptions({
    queryKey: residentKeys.directory(),
    queryFn: () => apiClient.get("/residents/directory", { schema: residentDirectorySchema }),
    staleTime: 5 * 60_000,
  })

/** Resident name for a Buddii ID, from one cached lookup. Falls back to the ID while loading. */
export function useResidentName(id: string | null | undefined) {
  const { data } = useQuery(residentDirectoryQuery())
  if (!id) return ""
  return data?.find((r) => r.id === id)?.name ?? id
}
