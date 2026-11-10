"use client"

import {
  ChevronRight,
  ClipboardList,
  HeartPulse,
  Info,
  Lock,
  MessageSquareWarning,
  Plus,
  ShieldAlert,
} from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { parseAsStringLiteral, useQueryState } from "nuqs"
import { useState } from "react"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"

import { OverflowTabsList } from "@/components/shared/overflow-tabs-list"
import { Panel } from "@/components/shared/panel"
import { EmptyState, QueryBoundary } from "@/components/shared/query-boundary"
import { StatusDot } from "@/components/shared/status-dot"
import { StatusPill } from "@/components/shared/status-pill"
import { Button } from "@/components/ui/button"
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { useActivity } from "@/features/activity/api"
import { ActivityItem } from "@/features/activity/components/activity-item"
import { RecordResponseDialog } from "@/features/activity/components/record-response-dialog"
import { type ActivityRecord } from "@/features/activity/schemas"
import { ChangePill, MEASURES } from "@/features/outcomes/components/outcome-measures"
import {
  ResidentOutcomeSummary,
  useResidentOutcome,
} from "@/features/outcomes/components/resident-outcome-summary"
import { AssessmentsTab } from "@/features/resident-records/components/assessments-tab"
import { DocumentsTab } from "@/features/resident-records/components/documents-tab"
import { useCan } from "@/features/session/api"
import { useSupportRequests } from "@/features/support-requests/api"
import { REQUEST_STATUS } from "@/features/support-requests/presentation"
import { formatDate, formatDayMonth, formatTime } from "@/lib/format"
import { cn } from "@/lib/utils"

import { useResident, useResidentName } from "../api"
import {
  CONSENT_STATUS,
  initials,
  isLocked,
  lastChange,
  latest,
  MATCH_STATUS,
  PROGRAMME_STATUS,
} from "../presentation"
import { RESIDENT_TABS, type ResidentTab } from "../resident-tabs"
import { JourneyStepper } from "./journey-stepper"
import { residentHref } from "./resident-link"
import { type ResidentDetail } from "../schemas"

const TAB_LABELS: [ResidentTab, string][] = [
  ["overview", "Overview"],
  ["plan", "Support plan"],
  ["activity", "Volunteer activity"],
  ["outcomes", "Outcomes"],
  ["assessments", "Assessments"],
  ["documents", "Documents"],
  ["observations", "Observations"],
  ["consent", "Consent & access"],
  ["history", "Activity history"],
]

/** Council design system: at most 8 tabs in the row (7 + More); fewer when the screen is narrow. */
const VISIBLE_TABS = 7

/** Full-page resident profile, following the Council Dashboard resident profile. */
export function ResidentProfile() {
  const { residentId } = useParams<{ residentId: string }>()
  const query = useResident(residentId)
  const name = useResidentName(residentId)

  return (
    <div className="space-y-6">
      <nav aria-label="Breadcrumb">
        <ol className="flex items-center gap-1.5 text-xs font-semibold tracking-[0.06em] text-muted-foreground uppercase">
          <li>
            <Link href="/residents" className="hover:text-heading">
              Residents
            </Link>
          </li>
          <li aria-hidden>
            <ChevronRight className="size-3.5" />
          </li>
          <li className="text-heading" aria-current="page">
            {name}
          </li>
        </ol>
      </nav>
      <QueryBoundary query={query} fallback={<ProfileSkeleton />} errorTitle="Resident not found">
        {(resident) => <ResidentDetail resident={resident} />}
      </QueryBoundary>
    </div>
  )
}

function ResidentDetail({ resident }: { resident: ResidentDetail }) {
  const [tabParam, setTabParam] = useQueryState("tab", parseAsStringLiteral(RESIDENT_TABS))
  const tab = tabParam ?? "overview"
  const setTab = (next: ResidentTab) => void setTabParam(next === "overview" ? null : next)
  const [responding, setResponding] = useState<ActivityRecord | null>(null)
  const locked = isLocked(resident.programmeStatus)
  const canReport = useCan("safeguarding.report") && !locked
  const canRequest = useCan("requests.create") && !locked
  const canRespond = useCan("activity.respond") && !locked
  const status = PROGRAMME_STATUS[resident.programmeStatus]
  const consent = CONSENT_STATUS[resident.consentStatus]
  const volunteer = resident.nextActivity?.volunteerRef ?? resident.lastActivity?.volunteerRef
  const alerts = openAlerts(resident)

  return (
    <>
      <Panel className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground">
              {initials(resident.name)}
            </span>
            <div className="min-w-0 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="mr-1 text-[26px] leading-9 font-semibold tracking-tight text-heading">
                  {resident.name}
                </h1>
                <StatusPill tone={status.tone} caps>
                  {status.label}
                </StatusPill>
                {alerts.length > 0 && (
                  <StatusPill tone="danger">
                    {alerts.length} outstanding {alerts.length === 1 ? "action" : "actions"}
                  </StatusPill>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {resident.ageBand} years · {resident.area} ({resident.postcodeDistrict}) ·
                Coordinator {resident.coordinatorRef} · Buddii ID{" "}
                <span className="font-semibold text-foreground tabular-nums">{resident.id}</span>
              </p>
            </div>
          </div>
          {(canReport || canRequest) && (
            <div className="flex shrink-0 flex-wrap gap-2">
              {canReport && (
                <Button asChild variant="outline" className="h-10 px-4">
                  <Link href={`/safeguarding?report=true&for=${resident.id}`}>
                    <ShieldAlert aria-hidden />
                    Report concern
                  </Link>
                </Button>
              )}
              {canRequest && (
                <Button asChild className="h-10 px-4">
                  <Link href={`/support-requests?new=true&for=${resident.id}`}>
                    <Plus aria-hidden />
                    Support request
                  </Link>
                </Button>
              )}
            </div>
          )}
        </div>

        <JourneyStepper journey={resident.journey} />

        <dl className="grid grid-cols-2 gap-3 rounded-card bg-muted/70 p-3 md:grid-cols-4">
          <SummaryTile label="Coordinator" value={resident.coordinatorRef} />
          <SummaryTile label="Key volunteer" value={volunteer ?? "Unassigned"} />
          <SummaryTile label="Consent">
            <StatusPill tone={consent.tone}>{CONSENT_SHORT[resident.consentStatus]}</StatusPill>
          </SummaryTile>
          <SummaryTile
            label="Next visit"
            value={resident.nextActivity ? formatDayMonth(resident.nextActivity.date) : "None"}
          />
          <MeasureTile residentId={resident.id} measure="wemwbs" label="Wellbeing (WEMWBS)" />
          <MeasureTile residentId={resident.id} measure="ucla" label="Loneliness (UCLA)" />
          <ScoreTile label="Visit check" series={resident.visitCheckHistory} />
          <SummaryTile
            label="Last visit"
            value={resident.lastActivity ? formatDayMonth(resident.lastActivity.date) : "Never"}
          />
        </dl>
      </Panel>

      {locked ? (
        <p className="flex items-start gap-3 rounded-card bg-muted px-5 py-4 text-sm text-foreground">
          <Lock className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
          <span>
            <span className="font-semibold">This record is closed and read-only.</span> Volunteer
            activity and alerts for {resident.name} have stopped. Contact the council with any
            questions.
          </span>
        </p>
      ) : (
        resident.needsProviderResponse && (
          <button
            type="button"
            onClick={() => setTab("observations")}
            className="flex w-full items-center gap-3 rounded-card bg-warning-soft px-5 py-4 text-left text-sm text-warning-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <MessageSquareWarning className="size-5 shrink-0" aria-hidden />
            <span className="flex-1 font-semibold">
              A volunteer observation needs your response.
            </span>
            <span className="font-semibold">Review</span>
          </button>
        )
      )}

      <Tabs value={tab} onValueChange={(v) => setTab(v as ResidentTab)} className="gap-6">
        <OverflowTabsList
          items={TAB_LABELS}
          value={tab}
          onSelect={setTab}
          max={VISIBLE_TABS}
          numbered
        />

        <TabsContent value="overview">
          <OverviewTab resident={resident} />
        </TabsContent>
        <TabsContent value="plan">
          <SupportPlanTab resident={resident} />
        </TabsContent>
        <TabsContent value="activity">
          <ActivityTab
            residentId={resident.id}
            onRespond={canRespond ? setResponding : undefined}
          />
        </TabsContent>
        <TabsContent value="outcomes">
          <OutcomesTab resident={resident} />
        </TabsContent>
        <TabsContent value="assessments">
          <AssessmentsTab residentId={resident.id} locked={locked} />
        </TabsContent>
        <TabsContent value="documents">
          <DocumentsTab residentId={resident.id} locked={locked} />
        </TabsContent>
        <TabsContent value="observations">
          <ActivityTab
            residentId={resident.id}
            onRespond={canRespond ? setResponding : undefined}
            observationsOnly
          />
        </TabsContent>
        <TabsContent value="consent">
          <ConsentTab resident={resident} />
        </TabsContent>
        <TabsContent value="history">
          <HistoryTab resident={resident} />
        </TabsContent>
      </Tabs>

      <RecordResponseDialog
        record={responding}
        onOpenChange={(open) => !open && setResponding(null)}
      />
    </>
  )
}

/** Card section of the profile. */
function Block({
  title,
  description,
  className,
  children,
}: {
  title?: string
  description?: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <section className={cn("rounded-card surface p-5", className)}>
      {title && (
        <header className={cn("mb-4", className?.includes("p-0") && "mb-0 px-5 pt-5 pb-4")}>
          <h3 className="text-sm font-semibold text-heading">{title}</h3>
          {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
        </header>
      )}
      {children}
    </section>
  )
}

/** Council-style summary tile: small uppercase label over the value. */
function SummaryTile({
  label,
  value,
  children,
}: {
  label: string
  value?: string
  children?: React.ReactNode
}) {
  return (
    <div className="min-w-0 rounded-lg surface px-3.5 py-3">
      <dt className="truncate text-[10px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className="mt-1 truncate text-sm font-semibold text-heading tabular-nums">
        {children ?? value}
      </dd>
    </div>
  )
}

/** Latest volunteer visit check (1-5) and the change since the previous visit. */
function ScoreTile({ label, series }: { label: string; series: number[] }) {
  const value = latest(series)
  const change = lastChange(series)
  const improved = change > 0
  return (
    <SummaryTile label={label}>
      <span className="flex items-center gap-2">
        {value === null ? "N/A" : `${value}/5`}
        {value !== null && change !== 0 && (
          <StatusPill tone={improved ? "success" : "danger"} className="px-1.5">
            {change > 0 ? "+" : ""}
            {change}
          </StatusPill>
        )}
      </span>
    </SummaryTile>
  )
}

/** Latest Council-verified score for one measure, with the change from baseline. */
function MeasureTile({
  residentId,
  measure,
  label,
}: {
  residentId: string
  measure: "wemwbs" | "ucla"
  label: string
}) {
  const { outcome } = useResidentOutcome(residentId)
  const pair = outcome?.[measure]
  const m = MEASURES[measure]
  return (
    <SummaryTile label={label}>
      {!pair || pair.baseline === null ? (
        <span className="text-muted-foreground">No baseline</span>
      ) : pair.latest === null ? (
        <span>
          {pair.baseline}/{m.max}{" "}
          <span className="text-xs font-normal text-muted-foreground">baseline</span>
        </span>
      ) : (
        <span className="flex items-center gap-2">
          {pair.latest}/{m.max}
          <ChangePill measure={measure} baseline={pair.baseline} latest={pair.latest} compact />
        </span>
      )}
    </SummaryTile>
  )
}

function openAlerts(resident: ResidentDetail) {
  return [
    resident.needsProviderResponse && "A volunteer observation needs your response",
    resident.consentStatus === "PENDING" && "Consent has not been recorded yet",
    resident.consentStatus === "WITHDRAWN" && "Consent has been withdrawn",
    resident.volunteerMatchStatus === "AWAITING_MATCH" &&
      !isLocked(resident.programmeStatus) &&
      "Waiting for the coordinator to match a volunteer",
  ].filter((alert): alert is string => Boolean(alert))
}

const CONSENT_SHORT: Record<ResidentDetail["consentStatus"], string> = {
  GIVEN: "Given",
  PENDING: "Pending",
  WITHDRAWN: "Withdrawn",
}

function OverviewTab({ resident }: { resident: ResidentDetail }) {
  const alerts = openAlerts(resident)

  return (
    <div className="grid min-w-0 gap-6 lg:grid-cols-3">
      <div className="min-w-0 space-y-6 lg:col-span-2">
        <Block
          title="Outcome summary"
          description="Baseline assessment against the latest Council-verified review"
          className="p-0"
        >
          <ResidentOutcomeSummary
            residentId={resident.id}
            rowHref={residentHref(resident.id, "outcomes")}
            compact
          />
        </Block>

        <Block title="Recent volunteer activity" className="p-0">
          <ActivityTab residentId={resident.id} limit={3} bare />
        </Block>
      </div>

      <div className="space-y-6">
        <Block title="Programme">
          <dl className="divide-y text-[13px]">
            {[
              ["Status", PROGRAMME_STATUS[resident.programmeStatus].label],
              ["Volunteer match", MATCH_STATUS[resident.volunteerMatchStatus]],
              ["Coordinator", resident.coordinatorRef],
              ["Consent", CONSENT_STATUS[resident.consentStatus].label],
              [
                "Next activity",
                resident.nextActivity
                  ? `${resident.nextActivity.type}, ${formatDayMonth(resident.nextActivity.date)}`
                  : "Nothing scheduled",
              ],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="text-right font-medium">{v}</dd>
              </div>
            ))}
          </dl>
        </Block>

        <Block title="Outstanding actions">
          {alerts.length === 0 ? (
            <p className="text-[13px] text-muted-foreground">Nothing outstanding.</p>
          ) : (
            <ul className="space-y-2">
              {alerts.map((alert) => (
                <li key={alert}>
                  <StatusDot tone="warning">{alert}</StatusDot>
                </li>
              ))}
            </ul>
          )}
        </Block>
      </div>
    </div>
  )
}

function SupportPlanTab({ resident }: { resident: ResidentDetail }) {
  const requests = useSupportRequests(undefined, resident.id)
  return (
    <div className="space-y-4">
      <Block title="Support goals" description="Agreed with the council at assignment">
        <ol className="space-y-2">
          {resident.supportGoals.map((goal, i) => (
            <li key={goal} className="flex items-center gap-3 text-[13px]">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
                {i + 1}
              </span>
              {goal}
            </li>
          ))}
        </ol>
      </Block>

      <Block title="Permitted volunteer activities" description="What volunteers may support with">
        <ul className="flex flex-wrap gap-2">
          {resident.permittedActivities.map((a) => (
            <li
              key={a}
              className="rounded-lg bg-success-soft px-3 py-1.5 text-[13px] font-medium text-success-foreground"
            >
              {a}
            </li>
          ))}
        </ul>
        <p className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
          <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          Clinical care plans, medication and regulated care information are not held in the
          Provider Portal.
        </p>
      </Block>

      <Block className="p-0">
        <h3 className="border-b px-5 py-4 text-sm font-semibold text-heading">Support requests</h3>
        <QueryBoundary query={requests} fallback={<Skeleton className="m-5 h-16" />}>
          {(data) =>
            data.results.length === 0 ? (
              <EmptyState icon={ClipboardList} title="No support requests yet" />
            ) : (
              <ul className="divide-y">
                {data.results.map((r) => (
                  <li
                    key={r.id}
                    className="relative flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-search"
                  >
                    <div className="min-w-0">
                      <Link
                        href={`/support-requests?id=${r.id}`}
                        className="text-[13px] font-medium text-heading after:absolute after:inset-0 hover:underline"
                      >
                        {r.type}
                      </Link>
                      <p className="truncate text-xs text-muted-foreground">
                        {r.id} · {r.goal}
                      </p>
                    </div>
                    <StatusDot tone={REQUEST_STATUS[r.status].tone}>
                      {REQUEST_STATUS[r.status].label}
                    </StatusDot>
                  </li>
                ))}
              </ul>
            )
          }
        </QueryBoundary>
      </Block>
    </div>
  )
}

function ActivityTab({
  residentId,
  onRespond,
  observationsOnly,
  limit,
  bare,
}: {
  residentId: string
  onRespond?: (record: ActivityRecord) => void
  observationsOnly?: boolean
  /** Show only the most recent records. */
  limit?: number
  /** Render without its own card, inside another block. */
  bare?: boolean
}) {
  const query = useActivity("all", residentId)
  const Wrapper = bare ? "div" : Block
  return (
    <Wrapper className={bare ? "border-t" : "overflow-hidden p-0"}>
      <QueryBoundary query={query} fallback={<Skeleton className="m-5 h-32" />}>
        {(data) => {
          const all = observationsOnly ? data.results.filter((r) => r.observation) : data.results
          const records = limit ? all.slice(0, limit) : all
          return records.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title={observationsOnly ? "No observations yet" : "No volunteer activity yet"}
              description={
                observationsOnly ? "Volunteers record observations after each visit." : undefined
              }
            />
          ) : (
            <div className="divide-y">
              {records.map((record) => (
                <ActivityItem
                  key={record.id}
                  record={record}
                  onRespond={onRespond}
                  showClient={false}
                />
              ))}
            </div>
          )
        }}
      </QueryBoundary>
    </Wrapper>
  )
}

const visitChart = {
  visitCheck: { label: "Visit check", color: "var(--chart-1)" },
} satisfies ChartConfig

function OutcomesTab({ resident }: { resident: ResidentDetail }) {
  const data = resident.visitCheckHistory.map((score, i) => ({
    visit: `Visit ${i + 1}`,
    visitCheck: score,
  }))
  return (
    <div className="space-y-4">
      <Block
        title="Outcome summary"
        description="Baseline assessment against the latest Council-verified review"
        className="p-0"
      >
        <ResidentOutcomeSummary
          residentId={resident.id}
          rowHref={residentHref(resident.id, "assessments")}
        />
      </Block>
      <Block
        title="Visit checks"
        description="The volunteer's 1-5 check after each visit. Not an assessment score."
      >
        {data.length === 0 ? (
          <EmptyState
            icon={HeartPulse}
            title="No visit checks yet"
            description="Checks appear after the first volunteer visit."
          />
        ) : (
          <ChartContainer config={visitChart} className="aspect-auto h-56 w-full">
            <LineChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="visit" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis
                domain={[1, 5]}
                ticks={[1, 2, 3, 4, 5]}
                tickLine={false}
                axisLine={false}
                width={40}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                dataKey="visitCheck"
                type="monotone"
                stroke="var(--color-visitCheck)"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ChartContainer>
        )}
      </Block>
    </div>
  )
}

function ConsentTab({ resident }: { resident: ResidentDetail }) {
  const consent = CONSENT_STATUS[resident.consent.status]
  return (
    <div className="space-y-4">
      <Block title="Consent and lawful basis">
        <dl className="grid gap-3 sm:grid-cols-2">
          {[
            [
              "Consent status",
              <StatusDot key="s" tone={consent.tone}>
                {consent.label}
              </StatusDot>,
            ],
            ["Lawful basis", resident.consent.lawfulBasis],
            [
              "Recorded",
              resident.consent.recordedAt
                ? formatDate(resident.consent.recordedAt)
                : "Not yet recorded",
            ],
            ["Recorded by", resident.consent.recordedBy ?? "—"],
          ].map(([k, v]) => (
            <div key={String(k)} className="rounded-card bg-muted px-4 py-3">
              <dt className="text-xs text-muted-foreground">{k}</dt>
              <dd className="mt-1 text-[13px] font-medium">{v}</dd>
            </div>
          ))}
        </dl>
      </Block>
      <Block title="Data rights">
        <p className="text-[13px] leading-relaxed text-muted-foreground">
          Subject access, consent withdrawal and erasure requests go to the Data Controller. Buddii
          holds only the minimum information needed to coordinate volunteer support.
        </p>
      </Block>
    </div>
  )
}

function HistoryTab({ resident }: { resident: ResidentDetail }) {
  return (
    <Block title="Activity history" description="Programme events only, not a clinical record">
      <ol>
        {resident.history.map((h, i) => (
          <li key={h.id} className="flex gap-4">
            <div className="flex flex-col items-center" aria-hidden>
              <span className="mt-1.5 size-2 rounded-full bg-primary" />
              {i < resident.history.length - 1 && <span className="w-px flex-1 bg-border" />}
            </div>
            <div className="pb-5">
              <p className="text-[13px] font-medium">{h.event}</p>
              <p className="text-xs text-muted-foreground">
                {formatDate(h.at.slice(0, 10))} {formatTime(h.at)} · {h.actor}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </Block>
  )
}

function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-64 rounded-panel" />
      <Skeleton className="h-9 w-full max-w-3xl rounded-lg" />
      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-72 rounded-card lg:col-span-2" />
        <Skeleton className="h-72 rounded-card" />
      </div>
    </div>
  )
}
