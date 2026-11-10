"use client"

import {
  ChevronLeft,
  ChevronRight,
  MessageSquareWarning,
  Search,
  Send,
  UserCheck,
  Users,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { parseAsInteger, parseAsString, parseAsStringLiteral, useQueryState } from "nuqs"
import { useDeferredValue } from "react"

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
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useCan } from "@/features/session/api"
import { formatDayMonth } from "@/lib/format"
import { KpiIcons } from "@/lib/icons"
import { cn } from "@/lib/utils"

import { useResidents } from "../api"
import { initials, isLocked, latest, PROGRAMME_STATUS } from "../presentation"
import { type Resident, type ResidentListFilters } from "../schemas"
import { ResidentLink, residentHref } from "./resident-link"

const STATUS_FILTERS = [
  "all",
  "active",
  "pending",
  "needs_response",
  "awaiting_volunteer",
  "closed",
] as const
type StatusFilter = (typeof STATUS_FILTERS)[number]

const STATUS_LABEL: Record<StatusFilter, string> = {
  all: "All",
  active: "Active",
  pending: "Pending",
  needs_response: "Needs response",
  awaiting_volunteer: "Awaiting volunteer",
  closed: "Closed",
}

const STATUS_QUERY: Record<StatusFilter, ResidentListFilters> = {
  all: {},
  active: { status: "ACTIVE" },
  pending: { status: "PENDING" },
  needs_response: { needsResponse: true },
  awaiting_volunteer: { awaitingMatch: true },
  closed: { closed: true },
}

const ALL_AREAS = "all"

/** Residents Management, following the Council Dashboard residents table. */
export function ResidentsView() {
  const [status, setStatus] = useQueryState(
    "view",
    parseAsStringLiteral(STATUS_FILTERS).withDefault("all"),
  )
  const [area, setArea] = useQueryState("area", parseAsString.withDefault(ALL_AREAS))
  const [search, setSearch] = useQueryState("q", parseAsString.withDefault(""))
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1))
  const deferredSearch = useDeferredValue(search)
  const canRefer = useCan("referrals.create")

  const query = useResidents({
    ...STATUS_QUERY[status],
    area: area === ALL_AREAS ? undefined : area,
    search: deferredSearch || undefined,
    page: page > 1 ? page : undefined,
  })
  const all = useResidents()
  const areas = [...new Set(all.data?.results.map((c) => c.area))].sort()

  // Any filter change starts again from the first page.
  const resetPage = () => void setPage(null)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Residents"
        description="Residents assigned to your organisation through the council's Buddii programme"
        actions={
          <>
            <Button asChild variant="outline" className="h-10 px-4">
              <Link href="/assignments">
                <UserCheck aria-hidden />
                New assignments
              </Link>
            </Button>
            {canRefer && (
              <Button asChild className="h-10 px-4">
                <Link href="/residents/refer">
                  <Send aria-hidden />
                  Refer a resident
                </Link>
              </Button>
            )}
          </>
        }
      />

      <ResidentStats residents={all.data?.results} total={all.data?.count} />

      <Panel className="overflow-hidden p-0">
        <div className="flex flex-col gap-3 border-b px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            <Select
              value={area}
              onValueChange={(v) => {
                void setArea(v === ALL_AREAS ? null : v)
                resetPage()
              }}
            >
              <SelectTrigger
                className="h-10 w-full min-w-0 sm:w-auto sm:min-w-40"
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
              onValueChange={(v) => {
                void setStatus(v === "all" ? null : (v as StatusFilter))
                resetPage()
              }}
            >
              <SelectTrigger
                className="h-10 w-full min-w-0 sm:w-auto sm:min-w-40"
                aria-label="Filter by status"
              >
                <span className="text-muted-foreground">Status:</span>
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
          </div>
          <InputGroup className="h-10 lg:w-80">
            <InputGroupAddon>
              <Search aria-hidden />
            </InputGroupAddon>
            <InputGroupInput
              value={search}
              onChange={(e) => {
                void setSearch(e.target.value || null)
                resetPage()
              }}
              placeholder="Search by name, Buddii ID, area or goal"
              aria-label="Search residents"
            />
          </InputGroup>
        </div>

        <QueryBoundary query={query} fallback={<TableSkeleton />}>
          {(data) =>
            data.results.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No residents match"
                description={
                  status === "closed"
                    ? "Closed and deceased records appear here, read-only."
                    : "Try a different filter or search term."
                }
              />
            ) : (
              <>
                <ResidentsTable residents={data.results} />
                <Pagination
                  page={page}
                  shown={data.results.length}
                  total={data.count}
                  hasNext={data.next !== null}
                  onPage={(next) => void setPage(next === 1 ? null : next)}
                />
              </>
            )
          }
        </QueryBoundary>
      </Panel>
    </div>
  )
}

function ResidentStats({ residents, total }: { residents?: Resident[]; total?: number }) {
  if (!residents) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
    )
  }
  const active = residents.filter((r) => r.programmeStatus === "ACTIVE").length
  const needsResponse = residents.filter((r) => r.needsProviderResponse).length
  const awaiting = residents.filter((r) => r.volunteerMatchStatus === "AWAITING_MATCH").length

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      <StatCard
        featured
        href="/residents"
        label="Total residents"
        value={total ?? residents.length}
        icon={KpiIcons.people}
      />
      <StatCard
        label="Active"
        value={active}
        icon={KpiIcons.wellbeing}
        caption="in the programme"
        href="/residents?view=active"
      />
      <StatCard
        label="Needs response"
        value={needsResponse}
        attention={needsResponse > 0 ? "Action required" : undefined}
        icon={KpiIcons.attention}
        caption="volunteer observations"
        href="/residents?view=needs_response"
      />
      <StatCard
        label="Awaiting volunteer"
        value={awaiting}
        icon={KpiIcons.awaiting}
        caption="with the coordinator"
        href="/residents?view=awaiting_volunteer"
      />
    </div>
  )
}

function ResidentsTable({ residents }: { residents: Resident[] }) {
  const router = useRouter()

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className={tableHead}>Resident</TableHead>
          <TableHead className={tableHead}>Support need</TableHead>
          <TableHead className={tableHead}>Volunteer</TableHead>
          <TableHead className={tableHead}>Last visit</TableHead>
          <TableHead className={tableHead}>Next visit</TableHead>
          <TableHead className={tableHead}>Visit check</TableHead>
          <TableHead className={tableHead}>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {residents.map((r) => {
          const status = PROGRAMME_STATUS[r.programmeStatus]
          const wellbeing = latest(r.visitCheckHistory)
          const volunteer = r.nextActivity?.volunteerRef ?? r.lastActivity?.volunteerRef
          const locked = isLocked(r.programmeStatus)
          return (
            <TableRow
              key={r.id}
              // The name link is the keyboard target; the row is a larger mouse target.
              onClick={(e) => {
                if ((e.target as HTMLElement).closest("a")) return
                router.push(residentHref(r.id))
              }}
              className={cn(
                "cursor-pointer",
                r.needsProviderResponse && "bg-warning-soft/35 hover:bg-warning-soft/60",
                locked && "text-muted-foreground",
              )}
            >
              <TableCell className={tableCell}>
                <div className="flex items-center gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground tabular-nums">
                    {initials(r.name)}
                  </span>
                  <div className="min-w-0">
                    <ResidentLink
                      residentId={r.id}
                      className="block truncate font-semibold text-heading hover:underline"
                    >
                      {r.name}
                    </ResidentLink>
                    <span className="block text-xs text-muted-foreground tabular-nums">
                      {r.id} · {r.ageBand} · {r.area}
                    </span>
                  </div>
                </div>
              </TableCell>
              <TableCell className={tableCell}>
                {r.supportGoals[0] ? (
                  <StatusPill
                    tone="info"
                    caps
                    className="inline-block max-w-52 truncate align-middle"
                  >
                    {r.supportGoals[0]}
                  </StatusPill>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell className={cn(tableCell, "tabular-nums")}>
                {volunteer ?? <span className="text-muted-foreground">Unassigned</span>}
              </TableCell>
              <TableCell className={cn(tableCell, "tabular-nums")}>
                {r.lastActivity ? (
                  formatDayMonth(r.lastActivity.date)
                ) : (
                  <span className="text-muted-foreground">Never</span>
                )}
              </TableCell>
              <TableCell className={cn(tableCell, "tabular-nums")}>
                {r.nextActivity ? (
                  formatDayMonth(r.nextActivity.date)
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell className={cn(tableCell, "tabular-nums")}>
                {wellbeing === null ? (
                  <span className="text-muted-foreground">N/A</span>
                ) : (
                  `${wellbeing}/5`
                )}
              </TableCell>
              <TableCell className={tableCell}>
                <div className="flex flex-col items-start gap-1">
                  <StatusPill tone={status.tone} caps>
                    {status.label}
                  </StatusPill>
                  {r.needsProviderResponse && (
                    <span className="flex items-center gap-1 text-[11px] font-medium text-warning-foreground">
                      <MessageSquareWarning className="size-3" aria-hidden />
                      Response needed
                    </span>
                  )}
                </div>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}

const PAGE_SIZE = 20

function Pagination({
  page,
  shown,
  total,
  hasNext,
  onPage,
}: {
  page: number
  shown: number
  total: number
  hasNext: boolean
  onPage: (page: number) => void
}) {
  const from = (page - 1) * PAGE_SIZE + 1
  const to = from + shown - 1
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="flex items-center justify-between gap-4 border-t px-6 py-4">
      <p className="text-[13px] text-muted-foreground">
        Showing <span className="font-semibold text-foreground">{from}</span> to{" "}
        <span className="font-semibold text-foreground">{to}</span> of{" "}
        <span className="font-semibold text-foreground">{total}</span> residents
      </p>
      <nav className="flex items-center gap-1.5" aria-label="Pagination">
        <Button
          variant="outline"
          size="icon"
          className="size-9"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft aria-hidden />
        </Button>
        {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
          <Button
            key={n}
            variant={n === page ? "default" : "ghost"}
            size="icon"
            className="size-9 tabular-nums"
            onClick={() => onPage(n)}
            aria-current={n === page ? "page" : undefined}
          >
            {n}
          </Button>
        ))}
        <Button
          variant="outline"
          size="icon"
          className="size-9"
          disabled={!hasNext}
          onClick={() => onPage(page + 1)}
          aria-label="Next page"
        >
          <ChevronRight aria-hidden />
        </Button>
      </nav>
    </div>
  )
}

function TableSkeleton() {
  return (
    <div className="space-y-3 p-6">
      {Array.from({ length: 6 }, (_, i) => (
        <Skeleton key={i} className="h-12 w-full rounded-lg" />
      ))}
    </div>
  )
}
