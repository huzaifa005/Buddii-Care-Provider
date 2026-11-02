import { ChevronRight } from "lucide-react"
import Link from "next/link"

import { Panel, PanelHeader } from "@/components/shared/panel"
import { StatusDot } from "@/components/shared/status-dot"
import { formatDayMonth, isToday } from "@/lib/format"

import { CTA_LABEL, PRIORITY_DISPLAY } from "../presentation"
import { type ActionItem } from "../schemas"

export function AttentionList({ actions }: { actions: ActionItem[] }) {
  return (
    <Panel className="flex flex-col p-0 lg:col-span-8">
      <PanelHeader
        className="mb-0 border-b px-6 py-5"
        title="Needs your attention"
        description={
          actions.length === 0
            ? "You're all caught up"
            : `${actions.length} ${actions.length === 1 ? "item" : "items"} across residents, assignments and messages`
        }
      />
      {actions.length === 0 ? (
        <p className="px-6 py-12 text-center text-sm text-muted-foreground">
          New actions will appear here as they come in.
        </p>
      ) : (
        <ul className="divide-y">
          {actions.map((action) => (
            <li key={action.id}>
              <Link
                href={action.href}
                className="group flex items-start gap-4 px-6 py-4 outline-none hover:bg-muted/50 focus-visible:bg-muted/50"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <p className="text-sm font-medium text-heading">{action.title}</p>
                    <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground tabular-nums">
                      {action.relatedTo.ref}
                    </span>
                  </div>
                  <p className="line-clamp-1 text-[13px] text-muted-foreground">{action.detail}</p>
                  <div className="flex items-center gap-3 pt-0.5">
                    <StatusDot tone={PRIORITY_DISPLAY[action.priority].tone}>
                      {PRIORITY_DISPLAY[action.priority].label}
                    </StatusDot>
                    {action.due && (
                      <span className="text-xs text-muted-foreground">
                        Due {isToday(action.due) ? "today" : formatDayMonth(action.due)}
                      </span>
                    )}
                  </div>
                </div>
                <span className="mt-0.5 flex shrink-0 items-center gap-0.5 text-[13px] font-medium text-heading">
                  {CTA_LABEL[action.cta]}
                  <ChevronRight
                    className="size-4 transition-transform group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}
