"use client"

import { Send } from "lucide-react"

import { Panel, PanelHeader } from "@/components/shared/panel"
import { EmptyState, QueryBoundary } from "@/components/shared/query-boundary"
import { StatusDot } from "@/components/shared/status-dot"
import { type StatusTone } from "@/components/shared/status-pill"
import { Skeleton } from "@/components/ui/skeleton"
import { ClientLink } from "@/features/clients/components/client-link"
import { formatDate } from "@/lib/format"

import { useReferrals } from "../api"
import { type Referral, type ReferralStatus } from "../schemas"

const STATUS: Record<ReferralStatus, { label: string; tone: StatusTone }> = {
  SUBMITTED: { label: "Sent to council", tone: "neutral" },
  UNDER_REVIEW: { label: "Council reviewing", tone: "info" },
  APPROVED: { label: "Approved", tone: "success" },
  DECLINED: { label: "Not accepted", tone: "warning" },
}

/** Referrals this provider has sent to the council, newest first. */
export function ReferralsPanel({ action }: { action?: React.ReactNode }) {
  const query = useReferrals()

  return (
    <Panel className="p-0">
      <PanelHeader
        className="mb-0 border-b px-6 py-5"
        title="Your referrals"
        description="Residents you have referred to the council for the Buddii programme"
        action={action}
      />
      <QueryBoundary query={query} fallback={<Skeleton className="m-6 h-24" />}>
        {(referrals) =>
          referrals.length === 0 ? (
            <EmptyState
              icon={Send}
              title="No referrals yet"
              description="Refer a resident and follow the council's decision here."
            />
          ) : (
            <ul className="divide-y">
              {referrals.map((r) => (
                <ReferralRow key={r.id} referral={r} />
              ))}
            </ul>
          )
        }
      </QueryBoundary>
    </Panel>
  )
}

function ReferralRow({ referral: r }: { referral: Referral }) {
  const status = STATUS[r.status]
  return (
    <li className="flex flex-col gap-2 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 space-y-1">
        <p className="text-[13px] font-semibold text-heading tabular-nums">
          {r.id}
          <span className="font-normal text-muted-foreground"> · your ref {r.providerRef}</span>
        </p>
        <p className="text-xs text-muted-foreground">
          Age {r.ageBand} · {r.postcodeDistrict} · {r.supportTypes.join(", ")}
        </p>
        {r.councilNote && (
          <p className="text-xs text-foreground">
            <span className="text-muted-foreground">Council: </span>
            {r.councilNote}
          </p>
        )}
      </div>
      <div className="flex shrink-0 flex-col gap-1 sm:items-end">
        <StatusDot tone={status.tone}>{status.label}</StatusDot>
        <span className="text-xs text-muted-foreground">
          {r.clientId ? (
            <>
              Resident{" "}
              <ClientLink
                clientId={r.clientId}
                className="font-medium text-heading tabular-nums hover:underline"
              />
            </>
          ) : (
            `Sent ${formatDate(r.submittedAt)}`
          )}
        </span>
      </div>
    </li>
  )
}
