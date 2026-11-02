import { z } from "zod"

export const reportSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  category: z.enum(["ACTIVITY", "OUTCOMES", "SAFEGUARDING", "HOURS", "REQUESTS", "SOCIAL_VALUE"]),
  formats: z.array(z.enum(["PDF", "CSV"])),
  lastGeneratedAt: z.iso.datetime({ offset: true }).nullable(),
})
export type Report = z.infer<typeof reportSchema>

export const REPORT_PERIODS = ["THIS_MONTH", "LAST_MONTH", "THIS_QUARTER", "LAST_QUARTER"] as const
export const REPORT_PERIOD_LABEL: Record<(typeof REPORT_PERIODS)[number], string> = {
  THIS_MONTH: "This month",
  LAST_MONTH: "Last month",
  THIS_QUARTER: "This quarter",
  LAST_QUARTER: "Last quarter",
}
