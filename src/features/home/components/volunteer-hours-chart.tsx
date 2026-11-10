"use client"

import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts"

import { Panel, PanelHeader } from "@/components/shared/panel"
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { formatChartTick, formatDate, formatNumber } from "@/lib/format"

import { type DashboardSummary } from "../schemas"

const chartConfig = {
  hours: { label: "Volunteer hours", color: "var(--chart-1)" },
} satisfies ChartConfig

export function VolunteerHoursChart({ data }: { data: DashboardSummary["volunteerHours"] }) {
  const weeks = data.weeks
  const completeWeeks = weeks.slice(0, -1)
  const average =
    completeWeeks.length > 0
      ? completeWeeks.reduce((sum, w) => sum + w.hours, 0) / completeWeeks.length
      : 0

  return (
    <Panel className="flex flex-col xl:col-span-8">
      <PanelHeader
        title="Volunteer hours"
        description={`Weekly hours, last ${weeks.length} weeks`}
        action={
          <div className="text-right">
            <p className="text-xl font-semibold text-heading tabular-nums">
              {formatNumber(Math.round(average))} hrs
            </p>
            <p className="text-xs text-muted-foreground">weekly average</p>
          </div>
        }
      />
      <ChartContainer config={chartConfig} className="aspect-auto min-h-64 w-full flex-1">
        <BarChart data={weeks} margin={{ top: 12, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="weekStart"
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            tickFormatter={formatChartTick}
          />
          <YAxis tickLine={false} axisLine={false} width={44} />
          <ChartTooltip
            cursor={{ fill: "var(--muted)" }}
            content={
              <ChartTooltipContent
                labelFormatter={(value) => `Week of ${formatDate(String(value))}`}
                hideIndicator
              />
            }
          />
          <Bar dataKey="hours" radius={[6, 6, 0, 0]} maxBarSize={40}>
            {weeks.map((week, i) => (
              // The current week is still in progress, so it is drawn lighter.
              <Cell
                key={week.weekStart}
                fill="var(--color-hours)"
                fillOpacity={i === weeks.length - 1 ? 0.3 : 1}
              />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>
    </Panel>
  )
}
