"use client"

import { Plus, ShieldAlert } from "lucide-react"
import Link from "next/link"
import { useSyncExternalStore } from "react"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useSession } from "@/features/session/api"
import { useCan } from "@/features/session/api"
import { UK_TIME_ZONE } from "@/lib/format"

const ukHour = new Intl.DateTimeFormat("en-GB", {
  timeZone: UK_TIME_ZONE,
  hour: "numeric",
  hourCycle: "h23",
})
const ukLongDate = new Intl.DateTimeFormat("en-GB", {
  timeZone: UK_TIME_ZONE,
  weekday: "long",
  day: "numeric",
  month: "long",
})

function greetingFor(hour: number) {
  if (hour < 12) return "Good morning"
  if (hour < 18) return "Good afternoon"
  return "Good evening"
}

const noopSubscribe = () => () => {}

/**
 * Greeting and date depend on the current time, so the server renders neutral fallbacks and
 * the browser swaps in the real values without a hydration mismatch.
 */
function useNowLabels() {
  const greeting = useSyncExternalStore(
    noopSubscribe,
    () => greetingFor(Number(ukHour.format(new Date()))),
    () => "Welcome back",
  )
  const today = useSyncExternalStore(
    noopSubscribe,
    () => ukLongDate.format(new Date()),
    () => null,
  )
  return { greeting, today }
}

export function HomeHeader() {
  const { greeting, today } = useNowLabels()
  const { data: session } = useSession()
  const firstName = session?.user.displayName.split(" ")[0]
  const canReport = useCan("safeguarding.report")
  const canRequest = useCan("requests.create")

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="space-y-1">
        <p className="h-5 text-sm text-muted-foreground">
          {today}
          {today && session && " · "}
          {session && `${session.organisation.programme} programme`}
        </p>
        {session ? (
          <h1 className="text-[28px] leading-9 font-semibold tracking-tight text-heading">
            {greeting}, {firstName}
          </h1>
        ) : (
          <Skeleton className="h-9 w-64" />
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {canReport && (
          <Button asChild variant="outline" className="h-10 px-4">
            <Link href="/safeguarding?report=true">
              <ShieldAlert aria-hidden />
              Report a concern
            </Link>
          </Button>
        )}
        {canRequest && (
          <Button asChild className="h-10 px-4">
            <Link href="/support-requests?new=true">
              <Plus aria-hidden />
              New support request
            </Link>
          </Button>
        )}
      </div>
    </div>
  )
}
