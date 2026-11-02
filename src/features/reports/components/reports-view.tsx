"use client"

import {
  BarChart3,
  ClipboardCheck,
  Clock,
  Download,
  HeartPulse,
  type LucideIcon,
  ShieldAlert,
  Sparkles,
} from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { IconTile } from "@/components/shared/icon-tile"
import { PageHeader } from "@/components/shared/page-header"
import { QueryBoundary } from "@/components/shared/query-boundary"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { useCan } from "@/features/session/api"
import { formatDayMonth } from "@/lib/format"

import { useGenerateReport, useReports } from "../api"
import { type Report, REPORT_PERIOD_LABEL, REPORT_PERIODS } from "../schemas"

const CATEGORY: Record<
  Report["category"],
  { icon: LucideIcon; tone: React.ComponentProps<typeof IconTile>["tone"] }
> = {
  ACTIVITY: { icon: BarChart3, tone: "default" },
  OUTCOMES: { icon: HeartPulse, tone: "success" },
  HOURS: { icon: Clock, tone: "info" },
  REQUESTS: { icon: ClipboardCheck, tone: "neutral" },
  SAFEGUARDING: { icon: ShieldAlert, tone: "warning" },
  SOCIAL_VALUE: { icon: Sparkles, tone: "info" },
}

export function ReportsView() {
  const query = useReports()
  const [period, setPeriod] = useState<(typeof REPORT_PERIODS)[number]>("LAST_MONTH")
  const canSeeSafeguarding = useCan("reports.safeguarding")

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Standard programme reports for your organisation and the council"
        actions={
          <Select value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
            <SelectTrigger className="h-10 w-44 bg-card" aria-label="Report period">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {REPORT_PERIODS.map((p) => (
                <SelectItem key={p} value={p}>
                  {REPORT_PERIOD_LABEL[p]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />
      <QueryBoundary
        query={query}
        fallback={
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-52 rounded-card" />
            ))}
          </div>
        }
      >
        {(reports) => (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {reports
              .filter((r) => r.category !== "SAFEGUARDING" || canSeeSafeguarding)
              .map((r) => (
                <ReportCard key={r.id} report={r} period={period} />
              ))}
          </div>
        )}
      </QueryBoundary>
    </div>
  )
}

function ReportCard({
  report,
  period,
}: {
  report: Report
  period: (typeof REPORT_PERIODS)[number]
}) {
  const generate = useGenerateReport()
  const canGenerate = useCan("reports.generate")
  const { icon, tone } = CATEGORY[report.category]

  const run = async (format: "PDF" | "CSV") => {
    try {
      await generate.mutateAsync({ id: report.id, period, format })
      toast.success(`${report.title} is ready`, {
        description: `${REPORT_PERIOD_LABEL[period]} · ${format}. Download will start shortly.`,
      })
    } catch {
      toast.error("The report could not be generated")
    }
  }

  return (
    <article className="flex flex-col rounded-card surface p-6 surface-hover">
      <IconTile icon={icon} tone={tone} size="lg" />
      <h2 className="mt-4 font-semibold text-heading">{report.title}</h2>
      <p className="mt-1 flex-1 text-sm leading-relaxed text-muted-foreground">
        {report.description}
      </p>
      <p className="mt-4 text-xs text-muted-foreground">
        {report.lastGeneratedAt
          ? `Last generated ${formatDayMonth(report.lastGeneratedAt)}`
          : "Not generated yet"}
      </p>
      <div className="mt-4 flex gap-2 border-t pt-4">
        {report.formats.map((format) => (
          <Button
            key={format}
            variant={format === report.formats[0] ? "default" : "outline"}
            className="h-9 flex-1 rounded-lg"
            disabled={generate.isPending || !canGenerate}
            title={canGenerate ? undefined : "Your role cannot generate reports"}
            onClick={() => run(format)}
          >
            {generate.isPending && generate.variables?.format === format ? (
              <Spinner />
            ) : (
              <Download aria-hidden />
            )}
            {format}
          </Button>
        ))}
      </div>
    </article>
  )
}
