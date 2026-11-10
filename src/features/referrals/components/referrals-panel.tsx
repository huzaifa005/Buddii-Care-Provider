"use client"

import { FileText, Send } from "lucide-react"
import Link from "next/link"

import { Panel, PanelHeader } from "@/components/shared/panel"
import { EmptyState, QueryBoundary } from "@/components/shared/query-boundary"
import { StatusPill, type StatusTone } from "@/components/shared/status-pill"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ResidentLink } from "@/features/residents/components/resident-link"
import { useCan } from "@/features/session/api"
import { formatDate } from "@/lib/format"

import { useReferrals } from "../api"
import { type Referral, type ReferralStage } from "../schemas"

/** Council journey labels and tones (Council design system, "Status by stage"). */
export const REFERRAL_STAGE: Record<ReferralStage, { label: string; tone: StatusTone }> = {
  SENT: { label: "Sent to Council", tone: "neutral" },
  INFO_REQUESTED: { label: "Info requested", tone: "danger" },
  INFO_CHECKED: { label: "Info checked", tone: "neutral" },
  RECOMMENDED: { label: "Recommended", tone: "info" },
  APPROVED: { label: "Approved", tone: "success" },
  NOT_ACCEPTED: { label: "Not accepted", tone: "neutral" },
}

/** Residents this provider has sent to the Council, newest first. */
export function ReferralsPanel() {
  const query = useReferrals()
  const canRefer = useCan("referrals.create")

  return (
    <Panel className="p-0">
      <PanelHeader
        className="mb-0 border-b px-6 py-5"
        title="Sent to the Council"
        description="Residents you referred with a wellbeing assessment, and where they are in the Council journey"
        action={
          canRefer && (
            <Button asChild size="sm" variant="outline">
              <Link href="/residents/refer">
                <Send aria-hidden />
                Refer a resident
              </Link>
            </Button>
          )
        }
      />
      <QueryBoundary query={query} fallback={<Skeleton className="m-6 h-24" />}>
        {(referrals) =>
          referrals.length === 0 ? (
            <EmptyState
              icon={Send}
              title="No referrals yet"
              description="Refer a resident and follow the Council's decision here."
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
  const stage = REFERRAL_STAGE[r.stage]
  return (
    <li className="flex flex-col gap-2 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 space-y-1">
        <p className="text-sm font-semibold text-heading">
          {r.residentName}
          <span className="font-normal text-muted-foreground"> · {r.postcode}</span>
        </p>
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="tabular-nums">{r.id}</span>
          <span>Sent {formatDate(r.submittedAt)}</span>
          <span className="inline-flex items-center gap-1">
            <FileText className="size-3" aria-hidden />
            {r.documents.length} {r.documents.length === 1 ? "document" : "documents"}
          </span>
        </p>
        {r.councilNote && (
          <p className="text-xs text-foreground">
            <span className="text-muted-foreground">Council: </span>
            {r.councilNote}
          </p>
        )}
      </div>
      <div className="flex shrink-0 flex-col gap-1 sm:items-end">
        <StatusPill tone={stage.tone} caps>
          {stage.label}
        </StatusPill>
        {r.residentId && (
          <span className="text-xs text-muted-foreground">
            Resident{" "}
            <ResidentLink
              residentId={r.residentId}
              className="font-medium text-heading tabular-nums hover:underline"
            />
          </span>
        )}
      </div>
    </li>
  )
}
