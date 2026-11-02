import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query"
import { z } from "zod"

import { apiClient } from "@/lib/api/client"
import { useQuery } from "@/lib/api/use-query"

import { messageSchema, type Thread, threadSchema } from "./schemas"

export const messageKeys = { threads: ["messages", "threads"] as const }

export const threadsQuery = queryOptions({
  queryKey: messageKeys.threads,
  queryFn: () => apiClient.get("/messages/threads", { schema: z.array(threadSchema) }),
})

export function useThreads() {
  return useQuery(threadsQuery)
}

/** Optimistically appends the message so the conversation feels instant. */
export function useSendMessage(threadId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: string) =>
      apiClient.post(`/messages/threads/${threadId}/messages`, {
        schema: messageSchema,
        body: { body },
      }),
    onMutate: async (body) => {
      await queryClient.cancelQueries({ queryKey: messageKeys.threads })
      const previous = queryClient.getQueryData<Thread[]>(messageKeys.threads)
      queryClient.setQueryData<Thread[]>(messageKeys.threads, (threads) =>
        threads?.map((t) =>
          t.id === threadId
            ? {
                ...t,
                messages: [
                  ...t.messages,
                  {
                    id: `optimistic-${Date.now()}`,
                    from: "PROVIDER",
                    author: "You",
                    body,
                    sentAt: new Date().toISOString(),
                  },
                ],
              }
            : t,
        ),
      )
      return { previous }
    },
    onError: (_error, _body, context) => {
      if (context?.previous) queryClient.setQueryData(messageKeys.threads, context.previous)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: messageKeys.threads }),
  })
}

export function useMarkThreadRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (threadId: string) =>
      apiClient.post(`/messages/threads/${threadId}/read`, { schema: z.undefined(), body: {} }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: messageKeys.threads }),
  })
}
