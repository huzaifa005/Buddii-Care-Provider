import { CheckCircle2, MessageSquareWarning } from "lucide-react"

import { StatusDot } from "@/components/shared/status-dot"
import { Button } from "@/components/ui/button"
import { ResidentLink } from "@/features/residents/components/resident-link"
import { formatDayMonth, formatTime } from "@/lib/format"
import { cn } from "@/lib/utils"

import { ACTIVITY_STATUS } from "../presentation"
import { type ActivityRecord } from "../schemas"

/** One volunteer visit with its observation and the provider's response, if any. */
export function ActivityItem({
  record,
  onRespond,
  showClient = true,
}: {
  record: ActivityRecord
  onRespond?: (record: ActivityRecord) => void
  showClient?: boolean
}) {
  const status = ACTIVITY_STATUS[record.status]

  return (
    <article className={cn("flex gap-4 px-6 py-5", record.needsResponse && "bg-warning-soft/40")}>
      <div className="w-24 shrink-0">
        <p className="text-sm font-semibold whitespace-nowrap text-heading tabular-nums">
          {formatDayMonth(record.scheduledAt)}
        </p>
        <p className="text-xs text-muted-foreground tabular-nums">
          {formatTime(record.scheduledAt)}
        </p>
      </div>

      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <p className="text-sm font-medium text-heading">
            {showClient && (
              <>
                <ResidentLink
                  residentId={record.residentId}
                  tab="activity"
                  className="tabular-nums hover:underline"
                />
                <span className="font-normal text-muted-foreground"> · </span>
              </>
            )}
            {record.type}
          </p>
          <StatusDot tone={status.tone}>{status.label}</StatusDot>
        </div>
        <p className="text-xs text-muted-foreground">
          {record.volunteerRef}
          {record.durationMinutes && ` · ${record.durationMinutes} min`}
          {record.wellbeingScore !== null && ` · visit check ${record.wellbeingScore}/5`}
        </p>

        {record.observation && (
          <blockquote className="border-l-2 border-border pl-3 text-[13px] leading-relaxed text-foreground">
            {record.observation}
          </blockquote>
        )}

        {record.providerResponse && (
          <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
            <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-success" aria-hidden />
            <span>
              <span className="font-medium text-foreground">{record.providerResponse.by}:</span>{" "}
              {record.providerResponse.text}
            </span>
          </p>
        )}
      </div>

      {record.needsResponse && onRespond && (
        <Button size="sm" className="shrink-0 self-start" onClick={() => onRespond(record)}>
          <MessageSquareWarning aria-hidden />
          Respond
        </Button>
      )}
    </article>
  )
}
