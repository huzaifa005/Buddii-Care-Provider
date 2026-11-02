"use client"

import {
  type DefaultError,
  type QueryKey,
  useQuery as useTanstackQuery,
  type UseQueryOptions,
  type UseQueryResult,
} from "@tanstack/react-query"
import { useSyncExternalStore } from "react"

const noopSubscribe = () => () => {}

/** False while React hydrates server HTML, true afterwards (and on every client render). */
export function useHydrated() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  )
}

/**
 * TanStack `useQuery` that reports "pending" until hydration has finished.
 *
 * The server renders every query as pending (loading skeletons). Parts of the page hydrate at
 * different times (the header before a page's Suspense content), so a query one part started
 * can already hold data when another part hydrates, and React reports a hydration mismatch.
 * Holding the pending state until hydration ends makes the first client render match the
 * server; the real data shows on the next render. Fetching starts as normal.
 */
export function useQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(options: UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>): UseQueryResult<TData, TError> {
  const result = useTanstackQuery(options)
  const hydrated = useHydrated()
  if (hydrated) return result
  return {
    ...result,
    data: undefined,
    error: null,
    status: "pending",
    isPending: true,
    isLoading: true,
    isSuccess: false,
    isError: false,
    isLoadingError: false,
    isRefetchError: false,
    isPlaceholderData: false,
  } as UseQueryResult<TData, TError>
}
