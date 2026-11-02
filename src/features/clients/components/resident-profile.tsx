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

import { Panel } from "@/components/shared/panel"
import { EmptyState, QueryBoundary } from "@/components/shared/query-boundary"
import { StatusDot } from "@/components/shared/status-dot"
import { StatusPill } from "@/components/shared/status-pill"
import { Button } from "@/components/ui/button"
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useActivity } from "@/features/activity/api"
import { ActivityItem } from "@/features/activity/components/activity-item"
import { RecordResponseDialog } from "@/features/activity/components/record-response-dialog"
import { type ActivityRecord } from "@/features/activity/schemas"
import { useCan } from "@/features/session/api"
import { useSupportRequests } from "@/features/support-requests/api"
import { REQUEST_STATUS } from "@/features/support-requests/presentation"
import { formatDate, formatDayMonth, formatTime } from "@/lib/format"
import { cn } from "@/lib/utils"

import { useClient } from "../api"
import {
  CONSENT_STATUS,
  isLocked,
  lastChange,
  latest,
  MATCH_STATUS,
  PROGRAMME_STATUS,
} from "../presentation"
import { CLIENT_TABS, type ClientTab } from "../resident-tabs"
import { type ClientDetail } from "../schemas"

const TAB_LABELS: [ClientTab, string][] = [
  ["overview", "Overview"],
  ["plan", "Support plan"],
  ["activity", "Volunteer activity"],
  ["outcomes", "Outcomes"],
  ["observations", "Observations"],
  ["consent", "Consent & access"],
  ["history", "Activity history"],
]

/** Full-page resident profile, following the Council Dashboard resident profile. */
export function ResidentProfile() {
  const { residentId } = useParams<{ residentId: string }>()
  const query = useClient(residentId)

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
          <li className="text-heading tabular-nums" aria-current="page">
            {residentId}
          </li>
        </ol>
      </nav>
      <QueryBoundary query={query} fallback={<ProfileSkeleton />} errorTitle="Resident not found">
        {(client) => <ResidentDetail client={client} />}
      </QueryBoundary>
    </div>
  )
}

function ResidentDetail({ client }: { client: ClientDetail }) {
  const [tabParam, setTabParam] = useQueryState("tab", parseAsStringLiteral(CLIENT_TABS))
  const tab = tabParam ?? "overview"
  const setTab = (next: ClientTab) => void setTabParam(next === "overview" ? null : next)
  const [responding, setResponding] = useState<ActivityRecord | null>(null)
  const locked = isLocked(client.programmeStatus)
  const canReport = useCan("safeguarding.report") && !locked
  const canRequest = useCan("requests.create") && !locked
  const canRespond = useCan("activity.respond") && !locked
  const status = PROGRAMME_STATUS[client.programmeStatus]
  const consent = CONSENT_STATUS[client.consentStatus]
  const volunteer = client.nextActivity?.volunteerRef ?? client.lastActivity?.volunteerRef
  const alerts = openAlerts(client)

  return (
    <>
      <Panel className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground tabular-nums">
              {client.id.slice(-2)}
            </span>
            <div className="min-w-0 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="mr-1 text-[26px] leading-9 font-semibold tracking-tight text-heading tabular-nums">
                  {client.id}
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
                {client.ageBand} years · {client.postcodeDistrict} · Coordinator{" "}
                {client.coordinatorRef} · Buddii ID{" "}
                <span className="font-semibold text-foreground tabular-nums">{client.id}</span>
              </p>
            </div>
          </div>
          {(canReport || canRequest) && (
            <div className="flex shrink-0 flex-wrap gap-2">
              {canReport && (
                <Button asChild variant="outline" className="h-10 px-4">
                  <Link href={`/safeguarding?report=true&for=${client.id}`}>
                    <ShieldAlert aria-hidden />
                    Report concern
                  </Link>
                </Button>
              )}
              {canRequest && (
                <Button asChild className="h-10 px-4">
                  <Link href={`/support-requests?new=true&for=${client.id}`}>
                    <Plus aria-hidden />
                    Support request
                  </Link>
                </Button>
              )}
            </div>
          )}
        </div>

        <dl className="grid grid-cols-2 gap-3 rounded-card bg-muted/70 p-3 md:grid-cols-4">
          <SummaryTile label="Coordinator" value={client.coordinatorRef} />
          <SummaryTile label="Key volunteer" value={volunteer ?? "Unassigned"} />
          <SummaryTile label="Consent">
            <StatusPill tone={consent.tone}>{CONSENT_SHORT[client.consentStatus]}</StatusPill>
          </SummaryTile>
          <SummaryTile
            label="Next visit"
            value={client.nextActivity ? formatDayMonth(client.nextActivity.date) : "None"}
          />
          <ScoreTile label="Wellbeing" series={client.wellbeingHistory} goodWhen="up" />
          <ScoreTile label="Loneliness" series={client.lonelinessHistory} goodWhen="down" />
          <ScoreTile label="Confidence" series={client.confidenceHistory} goodWhen="up" />
          <SummaryTile
            label="Last visit"
            value={client.lastActivity ? formatDayMonth(client.lastActivity.date) : "Never"}
          />
        </dl>
      </Panel>

      {locked ? (
        <p className="flex items-start gap-3 rounded-card bg-muted px-5 py-4 text-sm text-foreground">
          <Lock className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
          <span>
            <span className="font-semibold">This record is closed and read-only.</span> Volunteer
            activity and alerts for {client.id} have stopped. Contact the council with any
            questions.
          </span>
        </p>
      ) : (
        client.needsProviderResponse && (
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

      <Tabs value={tab} onValueChange={(v) => setTab(v as ClientTab)} className="gap-6">
        <div className="overflow-x-auto">
          <TabsList className="h-auto w-max justify-start gap-1 bg-transparent p-0">
            {TAB_LABELS.map(([value, label], i) => (
              <TabsTrigger
                key={value}
                value={value}
                className="h-9 flex-none rounded-lg px-3.5 text-[13px] text-muted-foreground hover:text-heading data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                {i + 1}. {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="overview">
          <OverviewTab client={client} />
        </TabsContent>
        <TabsContent value="plan">
          <SupportPlanTab client={client} />
        </TabsContent>
        <TabsContent value="activity">
          <ActivityTab clientId={client.id} onRespond={canRespond ? setResponding : undefined} />
        </TabsContent>
        <TabsContent value="outcomes">
          <OutcomesTab client={client} />
        </TabsContent>
        <TabsContent value="observations">
          <ActivityTab
            clientId={client.id}
            onRespond={canRespond ? setResponding : undefined}
            observationsOnly
          />
        </TabsContent>
        <TabsContent value="consent">
          <ConsentTab client={client} />
        </TabsContent>
        <TabsContent value="history">
          <HistoryTab client={client} />
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

function ScoreTile({
  label,
  series,
  goodWhen,
}: {
  label: string
  series: number[]
  goodWhen: "up" | "down"
}) {
  const value = latest(series)
  const change = lastChange(series)
  const improved = goodWhen === "up" ? change > 0 : change < 0
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

function openAlerts(client: ClientDetail) {
  return [
    client.needsProviderResponse && "A volunteer observation needs your response",
    client.consentStatus === "PENDING" && "Consent has not been recorded yet",
    client.consentStatus === "WITHDRAWN" && "Consent has been withdrawn",
    client.volunteerMatchStatus === "AWAITING_MATCH" &&
      !isLocked(client.programmeStatus) &&
      "Waiting for the coordinator to match a volunteer",
  ].filter((alert): alert is string => Boolean(alert))
}

const CONSENT_SHORT: Record<ClientDetail["consentStatus"], string> = {
  GIVEN: "Given",
  PENDING: "Pending",
  WITHDRAWN: "Withdrawn",
}

const OUTCOME_DOMAINS = [
  ["Wellbeing", "wellbeingHistory", "up"],
  ["Loneliness", "lonelinessHistory", "down"],
  ["Confidence", "confidenceHistory", "up"],
] as const

function OverviewTab({ client }: { client: ClientDetail }) {
  const alerts = openAlerts(client)

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <Block
          title="Outcome journey"
          description="First volunteer-recorded score compared with the latest (1-5). Not a clinical assessment."
          className="p-0"
        >
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-y bg-muted/40 text-left text-[10px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
                <th className="py-2.5 pl-5 font-semibold">Domain</th>
                <th className="py-2.5 font-semibold">Baseline</th>
                <th className="py-2.5 font-semibold">Current</th>
                <th className="py-2.5 pr-5 text-right font-semibold">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {OUTCOME_DOMAINS.map(([label, key, goodWhen]) => {
                const series = client[key]
                const baseline = series[0] ?? null
                const current = latest(series)
                const diff = baseline === null || current === null ? null : current - baseline
                const improved = diff !== null && (goodWhen === "up" ? diff > 0 : diff < 0)
                return (
                  <tr key={key}>
                    <td className="py-3 pl-5 font-medium text-heading">
                      {label}
                      {goodWhen === "down" && (
                        <span className="block text-[11px] font-normal text-muted-foreground">
                          Lower is better
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-muted-foreground tabular-nums">
                      {baseline === null ? "N/A" : `${baseline}/5`}
                    </td>
                    <td className="py-3 font-semibold text-heading tabular-nums">
                      {current === null ? "N/A" : `${current}/5`}
                    </td>
                    <td className="py-3 pr-5 text-right">
                      {diff === null ? (
                        <span className="text-muted-foreground">No data</span>
                      ) : diff === 0 ? (
                        <StatusPill tone="info">Stable</StatusPill>
                      ) : (
                        <StatusPill tone={improved ? "success" : "danger"}>
                          {improved ? "Improved" : "Worse"} {diff > 0 ? "+" : ""}
                          {diff}
                        </StatusPill>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Block>

        <Block title="Recent volunteer activity" className="p-0">
          <ActivityTab clientId={client.id} limit={3} bare />
        </Block>
      </div>

      <div className="space-y-6">
        <Block title="Programme">
          <dl className="divide-y text-[13px]">
            {[
              ["Status", PROGRAMME_STATUS[client.programmeStatus].label],
              ["Volunteer match", MATCH_STATUS[client.volunteerMatchStatus]],
              ["Coordinator", client.coordinatorRef],
              ["Consent", CONSENT_STATUS[client.consentStatus].label],
              [
                "Next activity",
                client.nextActivity
                  ? `${client.nextActivity.type}, ${formatDayMonth(client.nextActivity.date)}`
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

function SupportPlanTab({ client }: { client: ClientDetail }) {
  const requests = useSupportRequests(undefined, client.id)
  return (
    <div className="space-y-4">
      <Block title="Support goals" description="Agreed with the council at assignment">
        <ol className="space-y-2">
          {client.supportGoals.map((goal, i) => (
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
          {client.permittedActivities.map((a) => (
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
                  <li key={r.id} className="flex items-center justify-between gap-4 px-5 py-3.5">
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-heading">{r.type}</p>
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
  clientId,
  onRespond,
  observationsOnly,
  limit,
  bare,
}: {
  clientId: string
  onRespond?: (record: ActivityRecord) => void
  observationsOnly?: boolean
  /** Show only the most recent records. */
  limit?: number
  /** Render without its own card, inside another block. */
  bare?: boolean
}) {
  const query = useActivity("all", clientId)
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

const outcomeChart = {
  wellbeing: { label: "Wellbeing", color: "var(--chart-1)" },
  loneliness: { label: "Loneliness", color: "var(--chart-5)" },
  confidence: { label: "Confidence", color: "var(--chart-3)" },
} satisfies ChartConfig

function OutcomesTab({ client }: { client: ClientDetail }) {
  const data = client.wellbeingHistory.map((w, i) => ({
    visit: `Visit ${i + 1}`,
    wellbeing: w,
    loneliness: client.lonelinessHistory[i] ?? null,
    confidence: client.confidenceHistory[i] ?? null,
  }))
  return (
    <Block
      title="Wellbeing, loneliness and confidence"
      description="Recorded by volunteers on the Buddii outcome framework (1-5). Not a clinical assessment."
    >
      {data.length === 0 ? (
        <EmptyState
          icon={HeartPulse}
          title="No outcome scores yet"
          description="Scores appear after the first volunteer visit."
        />
      ) : (
        <ChartContainer config={outcomeChart} className="aspect-auto h-64 w-full">
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
            <ChartLegend content={<ChartLegendContent />} />
            {(["wellbeing", "loneliness", "confidence"] as const).map((key) => (
              <Line
                key={key}
                dataKey={key}
                type="monotone"
                stroke={`var(--color-${key})`}
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            ))}
          </LineChart>
        </ChartContainer>
      )}
    </Block>
  )
}

function ConsentTab({ client }: { client: ClientDetail }) {
  const consent = CONSENT_STATUS[client.consent.status]
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
            ["Lawful basis", client.consent.lawfulBasis],
            [
              "Recorded",
              client.consent.recordedAt
                ? formatDate(client.consent.recordedAt)
                : "Not yet recorded",
            ],
            ["Recorded by", client.consent.recordedBy ?? "—"],
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

function HistoryTab({ client }: { client: ClientDetail }) {
  return (
    <Block title="Activity history" description="Programme events only, not a clinical record">
      <ol>
        {client.history.map((h, i) => (
          <li key={h.id} className="flex gap-4">
            <div className="flex flex-col items-center" aria-hidden>
              <span className="mt-1.5 size-2 rounded-full bg-primary" />
              {i < client.history.length - 1 && <span className="w-px flex-1 bg-border" />}
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
