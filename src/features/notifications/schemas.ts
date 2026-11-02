import { z } from "zod"

export const notificationSchema = z.object({
  id: z.string(),
  kind: z.enum(["ASSIGNMENT", "OBSERVATION", "REQUEST", "SAFEGUARDING", "MESSAGE"]),
  title: z.string(),
  body: z.string(),
  href: z.string(),
  createdAt: z.iso.datetime({ offset: true }),
  read: z.boolean(),
})
export type Notification = z.infer<typeof notificationSchema>
