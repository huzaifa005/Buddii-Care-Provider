"use client"

import { addMonths, isBefore, parseISO } from "date-fns"
import { CalendarClock, ChevronDown, ClipboardList, Plus } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

import { EmptyState, QueryBoundary } from "@/components/shared/query-boundary"
import { StatusPill } from "@/components/shared/status-pill"
import { tableCell, tableHead } from "@/components/shared/table-styles"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { SECTIONS } from "@/features/referrals/assessment"
import { useResidentName } from "@/features/residents/api"
import { formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"

import { useAssessments } from "../api"
import {
  ASSESSMENT_KIND_LABEL,
  ASSESSMENT_KINDS,
  type AssessmentKind,
  type AssessmentRecord,
} from "../schemas"
import { RECORD_STATUS } from "./record-status"

const QUESTION_LABEL = new Map(
  SECTIONS.flatMap((s) => [
    ...(s.questions ?? []).map((q) => [q.id, q.label] as const),
    ...(s.scale?.rows ?? []).map((r) => [r.id, r.label] as const),
  ]),
)

const newHref = (residentId: string, kind: AssessmentKind) =>
  `/residents/${encodeURIComponent(residentId)}/assessments/new?kind=${kind}`

/** What is due next: baseline first, then reviews 3 and 6 months after the baseline. */
function nextDue(records: AssessmentRecord[]) {
  const baseline = records.find((r) => r.kind === "BASELINE")
  if (!baseline) return { kind: "BASELINE" as const, due: null }
  for (const [kind, months] of [
    ["REVIEW_3M", 3],
    ["REVIEW_6M", 6],
  ] as const) {
    if (!records.some((r) => r.kind === kind))
      return { kind, due: addMonths(parseISO(baseline.submittedAt), months) }
  }
  return null
}

export function AssessmentsTab({ residentId, locked }: { residentId: string; locked: boolean }) {
  const query = useAssessments(residentId)
  const [open, setOpen] = useState<AssessmentRecord | null>(null)

  return (
    <QueryBoundary query={query} fallback={<Skeleton className="h-64 rounded-card" />}>
      {(records) => {
        const next = nextDue(records)
        const overdue = next?.due ? isBefore(next.due, new Date()) : false
        return (
          <div className="space-y-4">
            <section className="flex flex-wrap items-center justify-between gap-4 rounded-card surface p-5">
              <div className="flex items-start gap-3">
                <CalendarClock className="mt-0.5 size-5 text-muted-foreground" aria-hidden />
                <div>
                  <h3 className="text-sm font-semibold text-heading">Wellbeing assessments</h3>
                  <p className="text-[13px] text-muted-foreground">
                    {!next
                      ? "Baseline and both reviews are done."
                      : next.due
                        ? `${ASSESSMENT_KIND_LABEL[next.kind]} ${overdue ? "was due" : "due"} ${formatDate(next.due.toISOString().slice(0, 10))}.`
                        : "No baseline yet. Start with the baseline assessment."}
                  </p>
                  {overdue && (
                    <StatusPill tone="danger" className="mt-1.5">
                      Overdue
                    </StatusPill>
                  )}
                </div>
              </div>
              {!locked && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className="h-10 px-4">
                      <Plus aria-hidden />
                      Start assessment
                      <ChevronDown aria-hidden />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {ASSESSMENT_KINDS.map((kind) => (
                      <DropdownMenuItem key={kind} asChild>
                        <Link href={newHref(residentId, kind)}>
                          {ASSESSMENT_KIND_LABEL[kind]}
                          {next?.kind === kind && (
                            <span className="ml-auto text-xs text-muted-foreground">Next</span>
                          )}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </section>

            <section className="overflow-hidden rounded-card surface">
              {records.length === 0 ? (
                <EmptyState
                  icon={ClipboardList}
                  title="No assessments yet"
                  description="Assessments you send to the Council appear here."
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className={tableHead}>Assessment</TableHead>
                      <TableHead className={tableHead}>Sent</TableHead>
                      <TableHead className={tableHead}>Completed by</TableHead>
                      <TableHead className={tableHead}>Not known</TableHead>
                      <TableHead className={tableHead}>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.map((r) => (
                      <TableRow key={r.id} className="cursor-pointer" onClick={() => setOpen(r)}>
                        <TableCell className={tableCell}>
                          <button
                            type="button"
                            className="text-left font-semibold text-heading hover:underline"
                          >
                            {ASSESSMENT_KIND_LABEL[r.kind]}
                          </button>
                          <span className="block text-xs text-muted-foreground tabular-nums">
                            {r.id}
                          </span>
                          {r.councilNote && (
                            <span className="mt-1 block max-w-md text-xs whitespace-normal text-destructive-foreground">
                              Council: {r.councilNote}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className={cn(tableCell, "tabular-nums")}>
                          {formatDate(r.submittedAt)}
                        </TableCell>
                        <TableCell className={tableCell}>{r.completedBy}</TableCell>
                        <TableCell className={cn(tableCell, "tabular-nums")}>
                          {r.notKnown ? `${r.notKnown} to follow up` : "None"}
                        </TableCell>
                        <TableCell className={tableCell}>
                          <StatusPill tone={RECORD_STATUS[r.status].tone} caps>
                            {RECORD_STATUS[r.status].label}
                          </StatusPill>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </section>

            <AssessmentSheet
              record={open}
              onClose={() => setOpen(null)}
              residentId={residentId}
              locked={locked}
            />
          </div>
        )
      }}
    </QueryBoundary>
  )
}

function AssessmentSheet({
  record,
  onClose,
  residentId,
  locked,
}: {
  record: AssessmentRecord | null
  onClose: () => void
  residentId: string
  locked: boolean
}) {
  const residentName = useResidentName(residentId)
  return (
    <Sheet open={record !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-[520px]">
        {record && (
          <>
            <SheetHeader className="border-b px-6 py-5">
              <SheetTitle className="text-xl font-bold text-heading">
                {ASSESSMENT_KIND_LABEL[record.kind]}
              </SheetTitle>
              <SheetDescription>
                {residentName} · {record.id} · sent {formatDate(record.submittedAt)} by{" "}
                {record.completedBy}
              </SheetDescription>
            </SheetHeader>
            <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
              <div className="flex items-center gap-2">
                <StatusPill tone={RECORD_STATUS[record.status].tone} caps>
                  {RECORD_STATUS[record.status].label}
                </StatusPill>
                {record.reviewFlags > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {record.reviewFlags} {record.reviewFlags === 1 ? "answer" : "answers"} for the
                    reviewer
                  </span>
                )}
              </div>
              {record.councilNote && (
                <p className="rounded-lg bg-destructive-soft px-3 py-2.5 text-xs font-medium text-destructive-foreground">
                  Council: {record.councilNote}
                </p>
              )}
              <div>
                <p className="mb-2 text-xs font-semibold text-muted-foreground uppercase">
                  Answers
                </p>
                <dl className="divide-y rounded-lg border">
                  {Object.entries(record.answers).map(([id, value]) => (
                    <div
                      key={id}
                      className="grid grid-cols-[1fr_auto] gap-4 px-4 py-2.5 text-[13px]"
                    >
                      <dt className="text-muted-foreground">
                        <span className="mr-1 font-medium text-foreground tabular-nums">{id}.</span>
                        {QUESTION_LABEL.get(id) ?? "Note"}
                      </dt>
                      <dd className="text-right font-medium text-heading">
                        {Array.isArray(value) ? value.join(", ") : value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
              <p className="text-xs text-muted-foreground">
                Scores are calculated for the Council reviewer only. Only the Council marks an
                assessment Verified.
              </p>
            </div>
            {record.status === "INFO_REQUESTED" && !locked && (
              <div className="flex justify-end border-t px-6 py-4">
                <Button asChild>
                  <Link href={newHref(residentId, record.kind)}>Update and resend</Link>
                </Button>
              </div>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
