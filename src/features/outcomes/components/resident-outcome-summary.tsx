"use client"

import { HeartPulse } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { EmptyState, QueryBoundary } from "@/components/shared/query-boundary"
import { StatusPill } from "@/components/shared/status-pill"
import { tableCell, tableHead } from "@/components/shared/table-styles"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"

import { useOutcomeAssessments } from "../api"
import { type ResidentOutcome } from "../schemas"
import { ChangePill, MEASURE_KEYS, MEASURES } from "./outcome-measures"

/** One resident's outcomes, from the shared Council-verified assessments query. */
export function useResidentOutcome(residentId: string) {
  const query = useOutcomeAssessments()
  return {
    ...query,
    outcome: query.data?.residents.find((r) => r.residentId === residentId) ?? null,
  }
}

/**
 * Council "Outcome summary" (resident profile 03.5.07): baseline assessment against the latest
 * verified review, one row per measure.
 */
export function ResidentOutcomeSummary({
  residentId,
  rowHref,
  compact = false,
}: {
  residentId: string
  /** Narrow column (profile Overview): leaves out "How it is measured". */
  compact?: boolean
  /** Where a row leads: the Outcomes tab from Overview, the assessments behind the scores from Outcomes. */
  rowHref: string
}) {
  const query = useOutcomeAssessments()
  return (
    <QueryBoundary query={query} fallback={<Skeleton className="m-5 h-32" />}>
      {(data) => {
        const outcome = data.residents.find((r) => r.residentId === residentId)
        return outcome && outcome.wemwbs.baseline !== null ? (
          <SummaryTable outcome={outcome} rowHref={rowHref} compact={compact} />
        ) : (
          <EmptyState
            icon={HeartPulse}
            title="No baseline assessment yet"
            description="Outcomes appear once the Council verifies the baseline wellbeing assessment."
          />
        )
      }}
    </QueryBoundary>
  )
}

function SummaryTable({
  outcome,
  rowHref,
  compact,
}: {
  outcome: ResidentOutcome
  rowHref: string
  compact: boolean
}) {
  const router = useRouter()
  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className={tableHead}>Area</TableHead>
          {!compact && <TableHead className={tableHead}>How it is measured</TableHead>}
          <TableHead className={tableHead}>Baseline</TableHead>
          <TableHead className={tableHead}>
            Latest
            {outcome.lastVerifiedAt && outcome.wemwbs.latest !== null
              ? ` · ${formatDate(outcome.lastVerifiedAt)}`
              : ""}
          </TableHead>
          <TableHead className={tableHead}>Change</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {MEASURE_KEYS.map((key) => {
          const m = MEASURES[key]
          const { baseline, latest } = outcome[key]
          return (
            <TableRow key={key} className="cursor-pointer" onClick={() => router.push(rowHref)}>
              <TableCell className={cn(tableCell, "font-semibold text-heading")}>
                <Link href={rowHref} className="hover:underline">
                  {m.area}
                </Link>
              </TableCell>
              {!compact && (
                <TableCell className={cn(tableCell, "text-xs text-muted-foreground")}>
                  {m.measured}
                </TableCell>
              )}
              <TableCell className={cn(tableCell, "tabular-nums")}>
                {baseline === null ? "N/A" : `${baseline} / ${m.max}`}
              </TableCell>
              <TableCell className={cn(tableCell, "font-semibold text-heading tabular-nums")}>
                {latest === null ? "Review due" : `${latest} / ${m.max}`}
              </TableCell>
              <TableCell className={tableCell}>
                {baseline === null || latest === null ? (
                  <StatusPill tone="neutral">Awaiting review</StatusPill>
                ) : (
                  <ChangePill measure={key} baseline={baseline} latest={latest} />
                )}
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
