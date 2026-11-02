import { ArrowRight, MessageSquareWarning } from "lucide-react"
import Link from "next/link"

import { type ActionItem } from "../schemas"

/**
 * Amber banner for volunteer observations awaiting a provider response (v10 section 5).
 * A coordinator checking in at 9am must not miss a welfare flag from the day before.
 */
export function ObservationAlert({ actions }: { actions: ActionItem[] }) {
  const observations = actions.filter((a) => a.cta === "RESPOND" && a.relatedTo.kind === "CLIENT")
  if (observations.length === 0) return null

  const count = observations.length
  return (
    <Link
      href="/volunteer-activity?filter=needs_response"
      className="flex items-center gap-3 rounded-card bg-warning-soft px-5 py-4 text-sm text-warning-foreground outline-none hover:bg-warning-soft/80 focus-visible:ring-[3px] focus-visible:ring-ring/50"
    >
      <MessageSquareWarning className="size-4 shrink-0" aria-hidden />
      <span className="min-w-0 flex-1">
        <span className="font-semibold">
          {count} volunteer {count === 1 ? "observation needs" : "observations need"} your response
        </span>
        <span className="tabular-nums">
          {" "}
          · {observations.map((o) => o.relatedTo.ref).join(", ")}
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-1 font-semibold">
        Review
        <ArrowRight className="size-3.5" aria-hidden />
      </span>
    </Link>
  )
}
