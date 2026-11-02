import { queryOptions } from "@tanstack/react-query"

import { apiClient } from "@/lib/api/client"
import { paginatedSchema } from "@/lib/api/pagination"
import { useQuery } from "@/lib/api/use-query"

import { clientDetailSchema, type ClientListFilters, clientSchema } from "./schemas"

/** Hierarchical keys so a mutation can invalidate `clientKeys.all` or one client precisely. */
export const clientKeys = {
  all: ["clients"] as const,
  lists: () => [...clientKeys.all, "list"] as const,
  list: (filters: ClientListFilters) => [...clientKeys.lists(), filters] as const,
  details: () => [...clientKeys.all, "detail"] as const,
  detail: (id: string) => [...clientKeys.details(), id] as const,
}

export const clientListQuery = (filters: ClientListFilters = {}) =>
  queryOptions({
    queryKey: clientKeys.list(filters),
    queryFn: () =>
      apiClient.get("/clients", {
        schema: paginatedSchema(clientSchema),
        query: {
          status: filters.status,
          needs_response: filters.needsResponse,
          closed: filters.closed,
          area: filters.area,
          search: filters.search,
          page: filters.page,
        },
      }),
  })

export const clientDetailQuery = (id: string) =>
  queryOptions({
    queryKey: clientKeys.detail(id),
    queryFn: () =>
      apiClient.get(`/clients/${encodeURIComponent(id)}`, { schema: clientDetailSchema }),
  })

export function useClients(filters: ClientListFilters = {}, { enabled = true } = {}) {
  return useQuery({ ...clientListQuery(filters), enabled })
}

export function useClient(id: string) {
  return useQuery(clientDetailQuery(id))
}
