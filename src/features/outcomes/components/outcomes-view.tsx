"use client"

import { ArrowDownRight, ArrowUpRight, Info, Minus } from "lucide-react"
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"

import { PageHeader } from "@/components/shared/page-header"
import { Panel, PanelHeader } from "@/components/shared/panel"
import { QueryBoundary } from "@/components/shared/query-boundary"
import { deltaFrom, StatCard } from "@/components/shared/stat-card"
import { StatusDot } from "@/components/shared/status-dot"
import { type StatusTone } from "@/components/shared/status-pill"
import { tableCell, tableHead } from "@/components/shared/table-styles"
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ClientLink } from "@/features/clients/components/client-link"
import { KpiIcons } from "@/lib/icons"
import { cn } from "@/lib/utils"

import { useOutcomes } from "../api"
import { type OutcomesSummary } from "../schemas"

const monthFormat = new Intl.DateTimeFormat("en-GB", { month: "short" })

const trendConfig = {
  wellbeing: { label: "Wellbeing", color: "var(--chart-1)" },
  loneliness: { label: "Loneliness", color: "var(--chart-5)" },
  confidence: { label: "Confidence", color: "var(--chart-3)" },
} satisfies ChartConfig

const hoursConfig = { hours: { label: "Hours", color: "var(--chart-3)" } } satisfies ChartConfig

const GOAL_STATUS: Record<
  OutcomesSummary["clients"][number]["goalStatus"],
  { label: string; tone: StatusTone }
> = {
  PROGRESSING: { label: "Progressing", tone: "success" },
  STEADY: { label: "Steady", tone: "info" },
  NEEDS_REVIEW: { label: "Needs review", tone: "warning" },
  NOT_STARTED: { label: "Not started", tone: "neutral" },
}

export function OutcomesView() {
  const query = useOutcomes()
  return (
    <div className="space-y-6">
      <PageHeader
        title="Outcomes & Impact"
        description="How your residents are doing on the Buddii outcome framework"
      />
      <QueryBoundary
        query={query}
        fallback={
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-5">
              {Array.from({ length: 5 }, (_, i) => (
                <Skeleton key={i} className="h-32 rounded-card" />
              ))}
            </div>
            <Skeleton className="h-96 rounded-panel" />
          </div>
        }
      >
        {(data) => <OutcomesContent data={data} />}
      </QueryBoundary>
    </div>
  )
}

function OutcomesContent({ data }: { data: OutcomesSummary }) {
  const {
    averageWellbeing,
    averageLoneliness,
    averageConfidence,
    volunteerHours,
    goalsProgressing,
  } = data.metrics
  const oneDp = { format: (n: number) => n.toFixed(1) }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard
          label="Wellbeing"
          value={averageWellbeing.current.toFixed(1)}
          icon={KpiIcons.wellbeing}
          delta={deltaFrom(averageWellbeing.current, averageWellbeing.previous, oneDp)}
          caption="average, out of 5"
        />
        <StatCard
          label="Loneliness"
          value={averageLoneliness.current.toFixed(1)}
          icon={KpiIcons.people}
          delta={deltaFrom(averageLoneliness.current, averageLoneliness.previous, {
            ...oneDp,
            goodWhen: "down",
          })}
          caption="average, lower is better"
        />
        <StatCard
          label="Confidence"
          value={averageConfidence.current.toFixed(1)}
          icon={KpiIcons.confidence}
          delta={deltaFrom(averageConfidence.current, averageConfidence.previous, oneDp)}
          caption="average, out of 5"
        />
        <StatCard
          label="Volunteer hours"
          value={volunteerHours.current}
          icon={KpiIcons.hours}
          caption="this month"
        />
        <StatCard
          label="Goals progressing"
          value={`${goalsProgressing.current} of ${goalsProgressing.total}`}
          icon={KpiIcons.goals}
          caption="residents"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-12">
        <Panel className="xl:col-span-8">
          <PanelHeader
            title="Wellbeing, loneliness and confidence"
            description="Programme average, last 6 months"
          />
          <ChartContainer config={trendConfig} className="aspect-auto h-72 w-full">
            <LineChart data={data.monthly} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(v) => monthFormat.format(new Date(v))}
              />
              <YAxis
                domain={[1, 5]}
                ticks={[1, 2, 3, 4, 5]}
                tickLine={false}
                axisLine={false}
                width={40}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(v) => monthFormat.format(new Date(String(v)))}
                  />
                }
              />
              <ChartLegend content={<ChartLegendContent />} />
              <Line
                dataKey="wellbeing"
                type="monotone"
                stroke="var(--color-wellbeing)"
                strokeWidth={2.5}
                dot={{ r: 3 }}
              />
              <Line
                dataKey="loneliness"
                type="monotone"
                stroke="var(--color-loneliness)"
                strokeWidth={2.5}
                dot={{ r: 3 }}
              />
              <Line
                dataKey="confidence"
                type="monotone"
                stroke="var(--color-confidence)"
                strokeWidth={2.5}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ChartContainer>
        </Panel>
        <Panel className="xl:col-span-4">
          <PanelHeader title="Hours by activity" description="This month" />
          <ChartContainer config={hoursConfig} className="aspect-auto h-72 w-full">
            <BarChart data={data.hoursByType} layout="vertical" margin={{ left: 0, right: 16 }}>
              <XAxis type="number" hide />
              <YAxis dataKey="type" type="category" tickLine={false} axisLine={false} width={120} />
              <ChartTooltip
                cursor={{ fill: "var(--muted)" }}
                content={<ChartTooltipContent hideIndicator />}
              />
              <Bar dataKey="hours" fill="var(--color-hours)" radius={6} barSize={18} />
            </BarChart>
          </ChartContainer>
        </Panel>
      </div>

      <Panel className="p-0">
        <PanelHeader
          className="mb-0 border-b px-6 py-5"
          title="Outcomes by resident"
          description="First recorded score compared with the latest"
        />
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className={tableHead}>Resident</TableHead>
              <TableHead className={tableHead}>Wellbeing</TableHead>
              <TableHead className={tableHead}>Loneliness</TableHead>
              <TableHead className={tableHead}>Confidence</TableHead>
              <TableHead className={tableHead}>Volunteer hours</TableHead>
              <TableHead className={tableHead}>Goal progress</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.clients.map((c) => (
              <TableRow key={c.clientId}>
                <TableCell className={tableCell}>
                  <ClientLink
                    clientId={c.clientId}
                    tab="outcomes"
                    className="font-medium text-heading tabular-nums hover:underline"
                  />
                </TableCell>
                <TableCell className={tableCell}>
                  <ScoreChange from={c.wellbeingStart} to={c.wellbeingNow} goodWhen="up" />
                </TableCell>
                <TableCell className={tableCell}>
                  <ScoreChange from={c.lonelinessStart} to={c.lonelinessNow} goodWhen="down" />
                </TableCell>
                <TableCell className={tableCell}>
                  <ScoreChange from={c.confidenceStart} to={c.confidenceNow} goodWhen="up" />
                </TableCell>
                <TableCell className={cn(tableCell, "tabular-nums")}>{c.hours}</TableCell>
                <TableCell className={tableCell}>
                  <StatusDot tone={GOAL_STATUS[c.goalStatus].tone}>
                    {GOAL_STATUS[c.goalStatus].label}
                  </StatusDot>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Panel>

      <p className="flex items-start gap-2 text-xs text-muted-foreground">
        <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        Scores are recorded by volunteers on the Buddii outcome framework and are not clinical
        assessments. Social value figures use the approved Buddii methodology.
      </p>
    </>
  )
}

function ScoreChange({
  from,
  to,
  goodWhen,
}: {
  from: number | null
  to: number | null
  goodWhen: "up" | "down"
}) {
  if (from === null || to === null) return <span className="text-muted-foreground">—</span>
  const diff = to - from
  const improved = goodWhen === "up" ? diff > 0 : diff < 0
  const Icon = diff === 0 ? Minus : diff > 0 ? ArrowUpRight : ArrowDownRight
  return (
    <span className="inline-flex items-center gap-2 tabular-nums">
      <span className="text-muted-foreground">{from}</span>
      <span aria-hidden>→</span>
      <span className="font-semibold">{to}</span>
      <Icon
        className={cn(
          "size-4",
          diff === 0 ? "text-muted-foreground" : improved ? "text-success" : "text-destructive",
        )}
        aria-label={diff === 0 ? "No change" : improved ? "Improved" : "Worse"}
      />
    </span>
  )
}
