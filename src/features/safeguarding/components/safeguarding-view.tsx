"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { CheckCircle2, ShieldAlert, ShieldCheck, Siren } from "lucide-react"
import { parseAsBoolean, parseAsString, useQueryState } from "nuqs"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"

import { PageHeader } from "@/components/shared/page-header"
import { Panel, PanelHeader } from "@/components/shared/panel"
import { EmptyState, QueryBoundary } from "@/components/shared/query-boundary"
import { StatCard } from "@/components/shared/stat-card"
import { StatusDot } from "@/components/shared/status-dot"
import { type StatusTone } from "@/components/shared/status-pill"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { ClientSelect } from "@/features/clients/components/client-select"
import { useCan } from "@/features/session/api"
import { ApiError } from "@/lib/api/client"
import { formatDayMonth, formatTime } from "@/lib/format"
import { KpiIcons } from "@/lib/icons"

import { useConcerns, useReportConcern } from "../api"
import { EmergencyContactList } from "./emergency-contacts"
import { CONCERN_CATEGORIES, type Concern, type NewConcern, newConcernSchema } from "../schemas"

const SEVERITY: Record<Concern["severity"], { label: string; tone: StatusTone }> = {
  CRITICAL: { label: "Critical", tone: "danger" },
  HIGH: { label: "High", tone: "warning" },
  MEDIUM: { label: "Medium", tone: "neutral" },
}

const STATUS: Record<Concern["status"], { label: string; tone: StatusTone }> = {
  SUBMITTED: { label: "Submitted", tone: "neutral" },
  ROUTED: { label: "Routed", tone: "info" },
  UNDER_REVIEW: { label: "Under review", tone: "warning" },
  CLOSED: { label: "Closed", tone: "success" },
}

export function SafeguardingView() {
  const query = useConcerns()
  const [reporting, setReporting] = useQueryState("report", parseAsBoolean.withDefault(false))
  const [clientParam, setClientParam] = useQueryState("for", parseAsString)
  const concerns = query.data ?? []
  const canReport = useCan("safeguarding.report")
  const open = concerns.filter((c) => c.status !== "CLOSED")

  return (
    <div className="space-y-6">
      <PageHeader
        title="Safeguarding"
        description="Report concerns and follow how they are routed. Statutory case management stays with your organisation and the council."
        actions={
          canReport && (
            <Button variant="destructive" className="h-10 px-4" onClick={() => setReporting(true)}>
              <ShieldAlert aria-hidden />
              Report a concern
            </Button>
          )
        }
      />

      <div className="grid gap-6 xl:grid-cols-12">
        <div className="space-y-6 xl:col-span-8">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
            <StatCard
              label="Open concerns"
              value={query.data ? open.length : "–"}
              icon={KpiIcons.concern}
            />
            <StatCard
              label="Under review"
              value={query.data ? open.filter((c) => c.status !== "SUBMITTED").length : "–"}
              icon={KpiIcons.review}
            />
            <StatCard
              label="Closed"
              value={query.data ? concerns.length - open.length : "–"}
              icon={KpiIcons.resolved}
              caption="this quarter"
            />
          </div>

          <QueryBoundary query={query} fallback={<Skeleton className="h-72 rounded-panel" />}>
            {(data) =>
              data.length === 0 ? (
                <Panel>
                  <EmptyState icon={ShieldCheck} title="No concerns raised" />
                </Panel>
              ) : (
                <div className="space-y-4">
                  {data.map((c) => (
                    <ConcernCard key={c.id} concern={c} />
                  ))}
                </div>
              )
            }
          </QueryBoundary>
        </div>

        <Panel className="h-fit xl:col-span-4">
          <PanelHeader
            icon={Siren}
            iconTone="danger"
            title="In an emergency"
            description="Buddii is not an emergency service"
          />
          <EmergencyContactList />
          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
            If someone is in immediate danger, call 999 first, then report the concern here.
          </p>
        </Panel>
      </div>

      <ReportConcernDialog
        open={reporting && canReport}
        defaultClientId={clientParam ?? undefined}
        onOpenChange={(next) => {
          void setReporting(next ? true : null)
          if (!next) void setClientParam(null)
        }}
      />
    </div>
  )
}

function ConcernCard({ concern }: { concern: Concern }) {
  const severity = SEVERITY[concern.severity]
  const status = STATUS[concern.status]
  return (
    <article className="rounded-card surface p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-heading tabular-nums">
            {concern.id} · {concern.clientId}
          </p>
          <p className="text-xs text-muted-foreground">
            {concern.category} · raised {formatDayMonth(concern.raisedAt)} by {concern.raisedBy}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <StatusDot tone={severity.tone}>{severity.label}</StatusDot>
          <StatusDot tone={status.tone}>{status.label}</StatusDot>
        </div>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-foreground">{concern.description}</p>
      {concern.routedTo && (
        <p className="mt-2 text-xs text-muted-foreground">Routed to {concern.routedTo}</p>
      )}
      <ol className="mt-5 space-y-2 border-t pt-4">
        {concern.timeline.map((t, i) => (
          <li key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
            <CheckCircle2 className="size-3.5 shrink-0 text-primary" aria-hidden />
            <span className="text-foreground">{t.event}</span>
            <span>
              · {formatDayMonth(t.at)} {formatTime(t.at)}
            </span>
          </li>
        ))}
      </ol>
    </article>
  )
}

function ReportConcernDialog({
  open,
  onOpenChange,
  defaultClientId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultClientId?: string
}) {
  const mutation = useReportConcern()
  const form = useForm<NewConcern>({
    resolver: zodResolver(newConcernSchema),
    values: {
      clientId: defaultClientId ?? "",
      severity: "HIGH",
      category: "Physical welfare",
      description: "",
    },
  })

  const close = () => {
    onOpenChange(false)
    form.reset()
  }

  const onSubmit = form.handleSubmit(async (input) => {
    try {
      const created = await mutation.mutateAsync(input)
      toast.success("Concern submitted", {
        description: `${created.id} has been routed to the coordinator.`,
      })
      close()
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not submit the concern")
    }
  })

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : close())}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Report a safeguarding concern</DialogTitle>
          <DialogDescription>
            Buddii routes the concern to the coordinator and council. Statutory case management
            stays with your organisation.
          </DialogDescription>
        </DialogHeader>
        <form id="report-concern" onSubmit={onSubmit} className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <Controller
              control={form.control}
              name="clientId"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="rc-client">Resident</FieldLabel>
                  <ClientSelect
                    id="rc-client"
                    value={field.value}
                    onChange={field.onChange}
                    invalid={fieldState.invalid}
                  />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="severity"
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor="rc-severity">Severity</FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="rc-severity" className="h-10 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CRITICAL">Critical: immediate risk</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              )}
            />
          </div>
          <Controller
            control={form.control}
            name="category"
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor="rc-category">Category</FieldLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="rc-category" className="h-10 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONCERN_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="description"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="rc-description">What happened</FieldLabel>
                <Textarea
                  id="rc-description"
                  rows={5}
                  {...field}
                  aria-invalid={fieldState.invalid}
                  placeholder="What was observed, when, by whom, and any action already taken."
                />
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={close}>
            Cancel
          </Button>
          <Button type="submit" form="report-concern" disabled={mutation.isPending}>
            {mutation.isPending && <Spinner />}
            Submit concern
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
