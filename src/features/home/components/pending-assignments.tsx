"use client"

import { differenceInCalendarDays, parseISO } from "date-fns"
import Link from "next/link"

import { Panel, PanelHeader } from "@/components/shared/panel"
import { Button } from "@/components/ui/button"

import { type PendingAssignment } from "../schemas"

function receivedLabel(receivedAt: string) {
  const days = differenceInCalendarDays(new Date(), parseISO(receivedAt))
  if (days <= 0) return "Received today"
  return `Received ${days} ${days === 1 ? "day" : "days"} ago`
}

export function PendingAssignments({ assignments }: { assignments: PendingAssignment[] }) {
  return (
    <Panel className="flex flex-col lg:col-span-4">
      <PanelHeader
        title="Council assignments"
        description={
          assignments.length === 0
            ? "Nothing awaiting confirmation"
            : `${assignments.length} awaiting your confirmation`
        }
      />
      {assignments.length === 0 ? (
        <p className="flex-1 py-10 text-center text-sm text-muted-foreground">
          New assignments from the council will appear here.
        </p>
      ) : (
        <ul className="flex-1 space-y-3">
          {assignments.map((a) => (
            <li key={a.id} className="rounded-card border p-4">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-sm font-medium text-heading tabular-nums">{a.id}</p>
                <p className="text-[11px] text-muted-foreground">{receivedLabel(a.receivedAt)}</p>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Age {a.ageBand} · {a.postcodeDistrict} · Ref {a.councilRef}
              </p>
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {a.goals.map((goal) => (
                  <li
                    key={goal}
                    className="rounded-md bg-muted px-2 py-0.5 text-[11px] text-foreground"
                  >
                    {goal}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
      <Button asChild className="mt-5 w-full rounded-lg">
        <Link href="/assignments">Review assignments</Link>
      </Button>
    </Panel>
  )
}
