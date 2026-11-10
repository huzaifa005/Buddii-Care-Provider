"use client"

import { ClipboardCheck, Hourglass, Plus, Sparkles, UserSearch } from "lucide-react"
import { parseAsBoolean, parseAsString, parseAsStringLiteral, useQueryState } from "nuqs"
import { toast } from "sonner"

import { IconTile } from "@/components/shared/icon-tile"
import { PageHeader } from "@/components/shared/page-header"
import { Panel } from "@/components/shared/panel"
import { EmptyState, QueryBoundary } from "@/components/shared/query-boundary"
import { StatusDot } from "@/components/shared/status-dot"
import { tableCell, tableHead } from "@/components/shared/table-styles"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ResidentLink } from "@/features/residents/components/resident-link"
import { useCan } from "@/features/session/api"
import { formatDayMonth } from "@/lib/format"
import { cn } from "@/lib/utils"

import { useCancelSupportRequest, useSupportRequests } from "../api"
import { FREQUENCY_LABEL, REQUEST_STATUS } from "../presentation"
import { REQUEST_STATUSES, type RequestStatus } from "../schemas"
import { NewRequestSheet } from "./new-request-sheet"
import { RequestSheet } from "./request-sheet"

const PIPELINE: {
  status: RequestStatus
  icon: typeof Hourglass
  tone: "warning" | "info" | "success" | "neutral"
}[] = [
  { status: "COORDINATOR_REVIEW", icon: Hourglass, tone: "warning" },
  { status: "MATCHING", icon: UserSearch, tone: "info" },
  { status: "ACTIVE", icon: Sparkles, tone: "success" },
  { status: "COMPLETED", icon: ClipboardCheck, tone: "neutral" },
]

export function SupportRequestsView() {
  const [status, setStatus] = useQueryState("status", parseAsStringLiteral(REQUEST_STATUSES))
  const [isNew, setIsNew] = useQueryState("new", parseAsBoolean.withDefault(false))
  const [residentParam, setResidentParam] = useQueryState("for", parseAsString)
  const [openId, setOpenId] = useQueryState("id", parseAsString)
  const query = useSupportRequests(status ?? undefined)
  const cancel = useCancelSupportRequest()
  const canCreate = useCan("requests.create")
  const canCancel = useCan("requests.cancel")

  const onCancel = async (id: string) => {
    try {
      await cancel.mutateAsync(id)
      toast.success(`${id} cancelled`)
    } catch {
      toast.error("Could not cancel the request")
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Support Requests"
        description="Volunteer support you have requested, from coordinator review to active visits"
        actions={
          canCreate && (
            <Button className="h-10 px-4" onClick={() => setIsNew(true)}>
              <Plus aria-hidden />
              New request
            </Button>
          )
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {PIPELINE.map(({ status: s, icon, tone }) => {
          const active = status === s
          return (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(active ? null : s)}
              aria-pressed={active}
              className={cn(
                "flex items-center gap-4 rounded-card border bg-card p-5 text-left shadow-card transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                active ? "border-primary" : "border-transparent hover:border-border",
              )}
            >
              <IconTile icon={icon} tone={tone} size="lg" />
              <div className="min-w-0">
                <p className="text-2xl font-semibold text-heading tabular-nums">
                  {query.data?.counts[s] ?? "–"}
                </p>
                <p className="truncate text-sm text-muted-foreground">{REQUEST_STATUS[s].label}</p>
              </div>
            </button>
          )
        })}
      </div>

      <Panel className="p-0">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-heading">
              {status ? REQUEST_STATUS[status].label : "All requests"}
            </h2>
            <p className="text-xs text-muted-foreground">
              {status ? REQUEST_STATUS[status].hint : "Every request across your residents"}
            </p>
          </div>
          {status && (
            <Button variant="ghost" size="sm" onClick={() => setStatus(null)}>
              Show all
            </Button>
          )}
        </div>
        <QueryBoundary query={query} fallback={<Skeleton className="m-6 h-64" />}>
          {(data) =>
            data.results.length === 0 ? (
              <EmptyState
                icon={ClipboardCheck}
                title="No requests here"
                description="Requests you submit will appear in this list."
                action={canCreate && <Button onClick={() => setIsNew(true)}>New request</Button>}
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className={tableHead}>Request</TableHead>
                    <TableHead className={tableHead}>Resident</TableHead>
                    <TableHead className={tableHead}>Goal</TableHead>
                    <TableHead className={tableHead}>Volunteer</TableHead>
                    <TableHead className={tableHead}>Created</TableHead>
                    <TableHead className={tableHead}>Status</TableHead>
                    <TableHead className={cn(tableHead, "text-right")}>
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.results.map((r) => {
                    const st = REQUEST_STATUS[r.status]
                    const cancellable = r.status === "COORDINATOR_REVIEW" || r.status === "MATCHING"
                    return (
                      <TableRow
                        key={r.id}
                        className="cursor-pointer"
                        onClick={(e) => {
                          if ((e.target as HTMLElement).closest("a,button")) return
                          void setOpenId(r.id)
                        }}
                      >
                        <TableCell className={tableCell}>
                          <button
                            type="button"
                            className="text-left font-medium text-heading hover:underline"
                            onClick={() => void setOpenId(r.id)}
                          >
                            {r.type}
                          </button>
                          <p className="text-xs text-muted-foreground tabular-nums">
                            {r.id} · {FREQUENCY_LABEL[r.frequency]}
                            {r.riskLevel === "ELEVATED" && " · Elevated risk"}
                          </p>
                        </TableCell>
                        <TableCell className={tableCell}>
                          <ResidentLink
                            residentId={r.residentId}
                            className="font-medium text-heading tabular-nums hover:underline"
                          />
                        </TableCell>
                        <TableCell className={cn(tableCell, "max-w-72 whitespace-normal")}>
                          {r.goal}
                        </TableCell>
                        <TableCell className={cn(tableCell, "tabular-nums")}>
                          {r.volunteerRef ?? (
                            <span className="text-muted-foreground">Not yet matched</span>
                          )}
                        </TableCell>
                        <TableCell className={cn(tableCell, "text-muted-foreground")}>
                          {formatDayMonth(r.createdAt)}
                        </TableCell>
                        <TableCell className={tableCell}>
                          <StatusDot tone={st.tone}>{st.label}</StatusDot>
                        </TableCell>
                        <TableCell className={cn(tableCell, "text-right")}>
                          {cancellable && canCancel && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-muted-foreground"
                              onClick={() => void setOpenId(r.id)}
                            >
                              Cancel
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )
          }
        </QueryBoundary>
      </Panel>

      <RequestSheet
        request={query.data?.results.find((r) => r.id === openId) ?? null}
        onClose={() => void setOpenId(null)}
        canCancel={canCancel}
        cancelling={cancel.isPending}
        onCancel={onCancel}
      />

      <NewRequestSheet
        open={isNew && canCreate}
        defaultClientId={residentParam ?? undefined}
        onOpenChange={(open) => {
          void setIsNew(open ? true : null)
          if (!open) void setResidentParam(null)
        }}
      />
    </div>
  )
}
