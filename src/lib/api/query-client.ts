import { isServer, MutationCache, QueryCache, QueryClient } from "@tanstack/react-query"

import { ApiError } from "./client"

type UnauthorizedHandler = () => void
let onUnauthorized: UnauthorizedHandler | undefined

/** Registered by the app shell so any 401, from any query or mutation, ends the session. */
export function setUnauthorizedHandler(handler: UnauthorizedHandler | undefined) {
  onUnauthorized = handler
}

function handleError(error: unknown) {
  if (error instanceof ApiError && error.isUnauthorized) onUnauthorized?.()
}

export function makeQueryClient() {
  return new QueryClient({
    queryCache: new QueryCache({ onError: handleError }),
    mutationCache: new MutationCache({ onError: handleError }),
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          // Auth, permission and validation failures will not fix themselves on retry.
          if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false
          return failureCount < 2
        },
      },
    },
  })
}

let browserQueryClient: QueryClient | undefined

/** One query client per request on the server, one shared client in the browser. */
export function getQueryClient() {
  if (isServer) return makeQueryClient()
  browserQueryClient ??= makeQueryClient()
  return browserQueryClient
}
