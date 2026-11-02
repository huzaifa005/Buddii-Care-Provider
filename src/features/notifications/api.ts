import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query"
import { z } from "zod"

import { apiClient } from "@/lib/api/client"
import { useQuery } from "@/lib/api/use-query"

import { notificationSchema } from "./schemas"

export const notificationKeys = { all: ["notifications"] as const }

export const notificationsQuery = queryOptions({
  queryKey: notificationKeys.all,
  queryFn: () => apiClient.get("/notifications", { schema: z.array(notificationSchema) }),
  // Light polling until the backend offers push (FCM/WebSocket) for the web portal.
  refetchInterval: 60_000,
})

export function useNotifications() {
  return useQuery(notificationsQuery)
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () =>
      apiClient.post("/notifications/read-all", { schema: z.undefined(), body: {} }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
  })
}
