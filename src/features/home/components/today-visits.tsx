import Link from "next/link"

import { Panel, PanelHeader } from "@/components/shared/panel"
import { StatusDot } from "@/components/shared/status-dot"
import { Button } from "@/components/ui/button"
import { ClientLink } from "@/features/clients/components/client-link"
import { formatTime } from "@/lib/format"
import { cn } from "@/lib/utils"

import { VISIT_STATUS_DISPLAY } from "../presentation"
import { type Visit } from "../schemas"

export function TodayVisits({ visits }: { visits: Visit[] }) {
  return (
    <Panel className="flex flex-col xl:col-span-4">
      <PanelHeader
        title="Today's visits"
        description={`${visits.length} volunteer ${visits.length === 1 ? "visit" : "visits"}`}
      />
      {visits.length === 0 ? (
        <p className="flex-1 py-10 text-center text-sm text-muted-foreground">
          No volunteer visits today.
        </p>
      ) : (
        <ol className="flex-1">
          {visits.map((visit, i) => {
            const status = VISIT_STATUS_DISPLAY[visit.status]
            const last = i === visits.length - 1
            return (
              <li key={visit.id} className="flex gap-4">
                <time
                  dateTime={visit.scheduledAt}
                  className="w-11 shrink-0 pt-0.5 text-xs font-medium text-muted-foreground tabular-nums"
                >
                  {formatTime(visit.scheduledAt)}
                </time>
                {/* Timeline rail */}
                <div className="flex flex-col items-center" aria-hidden>
                  <span
                    className={cn(
                      "mt-1.5 size-2 rounded-full border-2",
                      visit.status === "COMPLETED"
                        ? "border-primary bg-primary"
                        : "border-muted-foreground/40 bg-card",
                    )}
                  />
                  {!last && <span className="w-px flex-1 bg-border" />}
                </div>
                <div className={cn("min-w-0 flex-1", !last && "pb-5")}>
                  <p className="text-sm font-medium text-heading">
                    <ClientLink clientId={visit.clientId} className="hover:underline" />
                    <span className="font-normal text-muted-foreground"> · {visit.type}</span>
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {visit.volunteerRef} · {visit.durationMinutes} min · {visit.postcodeDistrict}
                  </p>
                  <StatusDot tone={status.tone} className="mt-1.5">
                    {status.label}
                    {visit.wellbeingScore !== null && ` · wellbeing ${visit.wellbeingScore}/5`}
                  </StatusDot>
                </div>
              </li>
            )
          })}
        </ol>
      )}
      <Button asChild variant="outline" className="mt-5 w-full rounded-lg">
        <Link href="/volunteer-activity">View all activity</Link>
      </Button>
    </Panel>
  )
}
