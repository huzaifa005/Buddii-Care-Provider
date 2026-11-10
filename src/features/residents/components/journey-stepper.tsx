import { formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"

import { JOURNEY_STAGES, type Resident } from "../schemas"

/**
 * Council JourneyStepper: 8 equal segments. Done = navy bar, current = green bar and label,
 * upcoming = border bar and subtle label, with the date under each reached stage.
 */
export function JourneyStepper({ journey }: { journey: Resident["journey"] }) {
  const current = JOURNEY_STAGES.indexOf(journey.stage)
  return (
    <ol aria-label="Resident journey" className="grid grid-cols-4 gap-x-2 gap-y-4 md:grid-cols-8">
      {JOURNEY_STAGES.map((stage, i) => {
        const state = i < current ? "done" : i === current ? "current" : "upcoming"
        const date = journey.dates[i]
        return (
          <li
            key={stage}
            aria-current={state === "current" ? "step" : undefined}
            className="min-w-0"
          >
            <span
              aria-hidden
              className={cn(
                "block h-1.5 rounded-full",
                state === "done" && "bg-primary",
                state === "current" && "bg-success",
                state === "upcoming" && "bg-border",
              )}
            />
            <span
              className={cn(
                "mt-2 block truncate text-xs font-semibold",
                state === "done" && "text-heading",
                state === "current" && "text-success-foreground",
                state === "upcoming" && "font-medium text-muted-foreground",
              )}
            >
              {stage}
              <span className="sr-only">
                {state === "done" ? " (done)" : state === "current" ? " (current)" : " (not yet)"}
              </span>
            </span>
            <span className="block text-[11px] text-muted-foreground tabular-nums">
              {date ? formatDate(date) : "—"}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
