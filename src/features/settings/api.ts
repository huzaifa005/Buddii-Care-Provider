import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query"
import { z } from "zod"

import { apiClient } from "@/lib/api/client"
import { useQuery } from "@/lib/api/use-query"

import {
  type InviteUser,
  type NotificationSettings,
  notificationSettingsSchema,
  organisationSchema,
  providerUserSchema,
} from "./schemas"

export const settingsKeys = {
  users: ["settings", "users"] as const,
  organisation: ["settings", "organisation"] as const,
  notifications: ["settings", "notifications"] as const,
}

export const usersQuery = queryOptions({
  queryKey: settingsKeys.users,
  queryFn: () => apiClient.get("/users", { schema: z.array(providerUserSchema) }),
})

export const organisationQuery = queryOptions({
  queryKey: settingsKeys.organisation,
  queryFn: () => apiClient.get("/settings/organisation", { schema: organisationSchema }),
})

export const notificationsQuery = queryOptions({
  queryKey: settingsKeys.notifications,
  queryFn: () => apiClient.get("/settings/notifications", { schema: notificationSettingsSchema }),
})

export const useUsers = () => useQuery(usersQuery)
export const useOrganisation = () => useQuery(organisationQuery)
export const useNotificationSettings = () => useQuery(notificationsQuery)

export function useInviteUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: InviteUser) =>
      apiClient.post("/users/invite", { schema: providerUserSchema, body: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: settingsKeys.users }),
  })
}

export function useSaveNotificationSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: NotificationSettings) =>
      apiClient.put("/settings/notifications", { schema: notificationSettingsSchema, body: input }),
    onSuccess: (data) => queryClient.setQueryData(settingsKeys.notifications, data),
  })
}
