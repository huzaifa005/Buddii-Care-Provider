import { z } from "zod"

export const messageSchema = z.object({
  id: z.string(),
  from: z.enum(["PROVIDER", "COORDINATOR"]),
  author: z.string(),
  body: z.string(),
  sentAt: z.iso.datetime({ offset: true }),
})
export type Message = z.infer<typeof messageSchema>

/** Audited thread with the Volunteer Coordinator. Content must use Buddii IDs only. */
export const threadSchema = z.object({
  id: z.string(),
  subject: z.string(),
  participant: z.string(),
  clientRef: z.string().nullable(),
  unread: z.number().int(),
  messages: z.array(messageSchema),
})
export type Thread = z.infer<typeof threadSchema>

export const newMessageSchema = z.object({ body: z.string().trim().min(1).max(2000) })
