"use client"

import { isBefore, parseISO } from "date-fns"
import { FileText, HeartPulse, RotateCcw, Search } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { parseAsString, parseAsStringLiteral, useQueryState } from "nuqs"
import { useState } from "react"

import { PageHeader } from "@/components/shared/page-header"
import { Panel } from "@/components/shared/panel"
import { EmptyState, QueryBoundary } from "@/components/shared/query-boundary"
import { StatCard, StatCardSkeleton } from "@/components/shared/stat-card"
import { StatusPill } from "@/components/shared/status-pill"
import { tableCell, tableHead } from "@/components/shared/table-styles"
import { Button } from "@/components/ui/button"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { residentHref, ResidentLink } from "@/features/residents/components/resident-link"
import { formatDate } from "@/lib/format"
import { KpiIcons } from "@/lib/icons"
import { cn } from "@/lib/utils"

import { useOutcomeAssessments } from "../api"
import {
  ChangePill,
  direction,
  DIRECTION,
  MEASURE_KEYS,
  type MeasureKey,
  MEASURES,
  round1,
  ScorePair,
  signed,
} from "./outcome-measures"
import { type OutcomesAssessments, type ResidentOutcome } from "../schemas"

const STATUS_FILTERS = ["all", "improved", "no_change", "declined", "awaiting", "overdue"] as const
type StatusFilter = (typeof STATUS_FILTERS)[number]
const STATUS_LABEL: Record<StatusFilter, string> = {
  all: "All",
  improved: "Improved",
  no_change: "No change",
  declined: "Declined",
  awaiting: "Awaiting review",
  overdue: "Review overdue",
}

const ALL_AREAS = "all"

/** A resident's overall outcome follows their wellbeing (WEMWBS) change. */
const residentDirection = (r: ResidentOutcome) =>
  direction("wemwbs", r.wemwbs.baseline, r.wemwbs.latest)

const isOverdue = (r: ResidentOutcome, today: Date) =>
  r.nextReviewDue !== null && isBefore(parseISO(r.nextReviewDue), today)

const avg = (values: number[]) =>
  values.length ? values.reduce((a, b) => a + b, 0) / values.length : null

/** Averages over residents who have both a verified baseline and a verified review. */
function summarise(residents: ResidentOutcome[], key: MeasureKey) {
  const paired = residents.filter((r) => r[key].baseline !== null && r[key].latest !== null)
  const baseline = avg(paired.map((r) => r[key].baseline!))
  const latest = avg(paired.map((r) => r[key].latest!))
  return { count: paired.length, baseline, latest }
}

/** Outcomes v2: Council table layout (KPI cards, Outcome summary, resident outcomes table). */
export function OutcomesViewV2() {
  const query = useOutcomeAssessments()
  return (
    <QueryBoundary
      query={query}
      fallback={
        <div className="space-y-6">
          <Skeleton className="h-16 w-80 rounded-lg" />
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => (
              <StatCardSkeleton key={i} />
            ))}
          </div>
          <Skeleton className="h-72 rounded-panel" />
        </div>
      }
    >
      {(data) => <OutcomesContent data={data} />}
    </QueryBoundary>
  )
}

function OutcomesContent({ data }: { data: OutcomesAssessments }) {
  const [status, setStatus] = useQueryState(
    "status",
    parseAsStringLiteral(STATUS_FILTERS).withDefault("all"),
  )
  const [area, setArea] = useQueryState("area", parseAsString.withDefault(ALL_AREAS))
  const [search, setSearch] = useQueryState("q", parseAsString.withDefault(""))
  const [openMeasure, setOpenMeasure] = useState<MeasureKey | null>(null)
  const today = new Date()

  const all = data.residents
  const reviewed = all.filter((r) => residentDirection(r) !== "awaiting")
  const improved = reviewed.filter((r) => residentDirection(r) === "improved")
  const overdue = all.filter((r) => isOverdue(r, today))
  const wellbeing = summarise(all, "wemwbs")
  const loneliness = summarise(all, "ucla")
  const areas = [...new Set(all.map((r) => r.area))].sort()

  const term = search.trim().toLowerCase()
  const rows = all.filter(
    (r) =>
      (area === ALL_AREAS || r.area === area) &&
      (status === "all" ||
        (status === "overdue" ? isOverdue(r, today) : residentDirection(r) === status)) &&
      (!term ||
        r.name.toLowerCase().includes(term) ||
        r.residentId.toLowerCase().includes(term) ||
        r.area.toLowerCase().includes(term)),
  )
  const filtered = status !== "all" || area !== ALL_AREAS || term !== ""

  return (
    <div className="space-y-6">
      <PageHeader
        title="Outcomes"
        description={`Baseline assessment against the latest Council-verified review · verified to ${formatDate(data.asOf)}`}
        actions={
          <Button asChild className="h-10 px-4">
            <Link href="/reports">
              <FileText aria-hidden />
              Outcomes report
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          featured
          label="Reviewed residents"
          value={`${reviewed.length} of ${all.length}`}
          icon={KpiIcons.people}
          caption="with a verified review"
          href="/outcomes"
        />
        <StatCard
          label="Wellbeing change"
          value={
            wellbeing.baseline === null ? "N/A" : signed(wellbeing.latest! - wellbeing.baseline)
          }
          icon={KpiIcons.wellbeing}
          caption={`WEMWBS average · ${improved.length} improved`}
          href="/outcomes?status=improved"
        />
        <StatCard
          label="Loneliness change"
          value={
            loneliness.baseline === null ? "N/A" : signed(loneliness.latest! - loneliness.baseline)
          }
          icon={KpiIcons.people}
          caption="UCLA average · lower is better"
          href="#outcome-summary"
        />
        <StatCard
          label="Reviews overdue"
          value={overdue.length}
          icon={KpiIcons.review}
          attention={overdue.length > 0 ? "Action required" : undefined}
          caption="review date has passed"
          href="/outcomes?status=overdue"
        />
      </div>

      <Panel id="outcome-summary" className="scroll-mt-24 overflow-hidden p-0">
        <header className="px-6 pt-5 pb-4">
          <h2 className="text-base font-semibold text-heading">Outcome summary</h2>
          <p className="text-xs text-muted-foreground">
            Average for residents with a verified baseline and review. Select a row to see each
            resident.
          </p>
        </header>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className={tableHead}>Area</TableHead>
              <TableHead className={tableHead}>How it is measured</TableHead>
              <TableHead className={tableHead}>Residents</TableHead>
              <TableHead className={tableHead}>Baseline</TableHead>
              <TableHead className={tableHead}>Latest</TableHead>
              <TableHead className={tableHead}>Change</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {MEASURE_KEYS.map((key) => {
              const m = MEASURES[key]
              const s = summarise(all, key)
              return (
                <TableRow key={key} className="cursor-pointer" onClick={() => setOpenMeasure(key)}>
                  <TableCell className={cn(tableCell, "font-semibold text-heading")}>
                    <button type="button" className="text-left hover:underline">
                      {m.area}
                    </button>
                  </TableCell>
                  <TableCell className={cn(tableCell, "text-xs text-muted-foreground")}>
                    {m.measured}
                  </TableCell>
                  <TableCell className={cn(tableCell, "tabular-nums")}>{s.count}</TableCell>
                  <TableCell className={cn(tableCell, "tabular-nums")}>
                    {s.baseline === null ? "N/A" : `${round1(s.baseline)} / ${m.max}`}
                  </TableCell>
                  <TableCell className={cn(tableCell, "font-semibold text-heading tabular-nums")}>
                    {s.latest === null ? "N/A" : `${round1(s.latest)} / ${m.max}`}
                  </TableCell>
                  <TableCell className={tableCell}>
                    {s.baseline === null || s.latest === null ? (
                      <StatusPill tone="neutral">Awaiting review</StatusPill>
                    ) : (
                      <ChangePill measure={key} baseline={s.baseline} latest={s.latest} />
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </Panel>

      <Panel className="overflow-hidden p-0">
        <header className="px-6 pt-5 pb-1">
          <h2 className="text-base font-semibold text-heading">Resident outcomes</h2>
        </header>
        <div className="flex flex-col gap-3 border-b px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            <Select value={area} onValueChange={(v) => void setArea(v === ALL_AREAS ? null : v)}>
              <SelectTrigger
                className="w-full min-w-0 sm:w-auto sm:min-w-40"
                aria-label="Filter by area"
              >
                <span className="text-muted-foreground">Area:</span>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_AREAS}>All areas</SelectItem>
                {areas.map((a) => (
                  <SelectItem key={a} value={a}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={status}
              onValueChange={(v) => void setStatus(v === "all" ? null : (v as StatusFilter))}
            >
              <SelectTrigger
                className="w-full min-w-0 sm:w-auto sm:min-w-40"
                aria-label="Filter by outcome"
              >
                <span className="text-muted-foreground">Outcome:</span>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_FILTERS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {filtered && (
              <Button
                variant="ghost"
                className="h-10 px-3"
                onClick={() => {
                  void setStatus(null)
                  void setArea(null)
                  void setSearch(null)
                }}
              >
                <RotateCcw aria-hidden />
                Reset
              </Button>
            )}
          </div>
          <InputGroup className="h-10 lg:w-80">
            <InputGroupAddon>
              <Search aria-hidden />
            </InputGroupAddon>
            <InputGroupInput
              value={search}
              onChange={(e) => void setSearch(e.target.value || null)}
              placeholder="Search by name, Buddii ID or area"
              aria-label="Search resident outcomes"
            />
          </InputGroup>
        </div>
        {rows.length === 0 ? (
          <EmptyState
            icon={HeartPulse}
            title="No residents match"
            description="Try a different filter or search term."
          />
        ) : (
          <ResidentOutcomesTable rows={rows} today={today} />
        )}
        <p className="border-t px-6 py-3 text-xs text-muted-foreground">
          Showing {rows.length} of {all.length} residents. Scores come from Council wellbeing
          assessments; only the Council verifies them.
        </p>
      </Panel>

      <MeasureSheet measure={openMeasure} residents={all} onClose={() => setOpenMeasure(null)} />
    </div>
  )
}

function ResidentOutcomesTable({ rows, today }: { rows: ResidentOutcome[]; today: Date }) {
  const router = useRouter()
  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className={tableHead}>Resident</TableHead>
          <TableHead className={tableHead}>Area</TableHead>
          <TableHead className={tableHead}>Wellbeing (14-70)</TableHead>
          <TableHead className={tableHead}>Loneliness (3-9)</TableHead>
          <TableHead className={tableHead}>Visit check (1-5)</TableHead>
          <TableHead className={tableHead}>Next review</TableHead>
          <TableHead className={tableHead}>Outcome</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r) => {
          const dir = DIRECTION[residentDirection(r)]
          const late = isOverdue(r, today)
          return (
            <TableRow
              key={r.residentId}
              className="cursor-pointer"
              onClick={(e) => {
                if ((e.target as HTMLElement).closest("a")) return
                router.push(residentHref(r.residentId, "outcomes"))
              }}
            >
              <TableCell className={cn(tableCell, "whitespace-nowrap")}>
                <ResidentLink
                  residentId={r.residentId}
                  tab="outcomes"
                  className="font-semibold text-heading hover:underline"
                >
                  {r.name}
                </ResidentLink>
                <span className="ml-2 text-xs text-muted-foreground tabular-nums">
                  {r.residentId}
                </span>
              </TableCell>
              <TableCell className={tableCell}>{r.area}</TableCell>
              {MEASURE_KEYS.map((key) => (
                <TableCell key={key} className={tableCell}>
                  <ScorePair measure={key} pair={r[key]} />
                </TableCell>
              ))}
              <TableCell className={cn(tableCell, "tabular-nums")}>
                {r.nextReviewDue ? (
                  <span className={cn(late && "font-semibold text-destructive-foreground")}>
                    {formatDate(r.nextReviewDue)}
                    {late && " · overdue"}
                  </span>
                ) : (
                  <span className="text-muted-foreground">Baseline needed</span>
                )}
              </TableCell>
              <TableCell className={tableCell}>
                <StatusPill tone={dir.tone} caps>
                  {dir.label}
                </StatusPill>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}

function MeasureSheet({
  measure,
  residents,
  onClose,
}: {
  measure: MeasureKey | null
  residents: ResidentOutcome[]
  onClose: () => void
}) {
  const key = measure ?? "wemwbs"
  const m = MEASURES[key]
  return (
    <Sheet open={measure !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-[520px]">
        <SheetHeader className="border-b px-6 py-5">
          <SheetTitle className="text-xl font-bold text-heading">{m.area}</SheetTitle>
          <SheetDescription>{m.measured}</SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className={tableHead}>Resident</TableHead>
                <TableHead className={tableHead}>Baseline → latest</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {residents.map((r) => (
                <TableRow key={r.residentId}>
                  <TableCell className={tableCell}>
                    <ResidentLink
                      residentId={r.residentId}
                      tab="outcomes"
                      className="font-semibold text-heading hover:underline"
                    >
                      {r.name}
                    </ResidentLink>
                    <span className="block text-xs text-muted-foreground tabular-nums">
                      {r.residentId} · {r.area}
                    </span>
                  </TableCell>
                  <TableCell className={tableCell}>
                    <ScorePair measure={key} pair={r[key]} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </SheetContent>
    </Sheet>
  )
}
