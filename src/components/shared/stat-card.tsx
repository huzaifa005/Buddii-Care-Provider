import { ArrowDownRight, ArrowUpRight } from "lucide-react"
import Link from "next/link"

import { Skeleton } from "@/components/ui/skeleton"
import { type AppIcon } from "@/lib/icons"
import { cn } from "@/lib/utils"

export interface StatCardProps {
  label: string
  value: React.ReactNode
  icon: AppIcon
  /** Change against the previous period, already formatted (e.g. "+12%"). */
  delta?: { label: string; direction: "up" | "down" | "flat"; positive: boolean }
  caption?: string
  href?: string
  /** Navy hero card (first KPI on a dashboard), as in the Council Dashboard Figma. */
  featured?: boolean
  /** Flags the card (red left edge and pill), e.g. "Action required". Only when action is due. */
  attention?: string
}

/**
 * Dashboard KPI card from the Council Dashboard Figma: icon tile, small uppercase label and the
 * value, with an optional delta chip and caption. White by default; `featured` is the navy card.
 */
export function StatCard({
  label,
  value,
  icon: Icon,
  delta,
  caption,
  href,
  featured,
  attention,
}: StatCardProps) {
  const Arrow = delta?.direction === "down" ? ArrowDownRight : ArrowUpRight

  const body = (
    <>
      <div className="flex items-start justify-between">
        <span
          className={cn(
            "flex size-[35px] items-center justify-center rounded-[10.5px]",
            featured ? "bg-success-soft text-primary" : "bg-icon-tile text-icon-tile-foreground",
          )}
        >
          <Icon className="size-[18px]" aria-hidden />
        </span>
        {featured && href && <ArrowUpRight className="size-4 text-white" aria-hidden />}
      </div>
      <div className="mt-[18px] space-y-1.5">
        <p
          className={cn(
            "truncate text-[10px] leading-[13px] tracking-[0.53px] uppercase",
            featured ? "text-white" : "text-kpi-label",
          )}
        >
          {label}
        </p>
        <div className="flex items-end justify-between gap-3">
          <p
            className={cn(
              "text-2xl leading-[29px] font-semibold tracking-[-0.66px] whitespace-nowrap tabular-nums",
              featured ? "text-white" : "text-heading",
            )}
          >
            {value}
          </p>
          {attention ? (
            <span className="shrink-0 rounded-md bg-destructive-soft px-2 py-0.5 text-[11px] font-medium text-destructive-foreground">
              {attention}
            </span>
          ) : (
            delta &&
            delta.direction !== "flat" && (
              <span
                className={cn(
                  "inline-flex shrink-0 items-center gap-0.5 text-xs font-medium tabular-nums",
                  featured
                    ? "text-white"
                    : delta.positive
                      ? "text-success-foreground"
                      : "text-destructive-foreground",
                )}
              >
                <Arrow className="size-3.5" aria-hidden />
                {delta.label}
              </span>
            )
          )}
        </div>
        {caption && (
          <p className={cn("text-[11px]", featured ? "text-white/70" : "text-muted-foreground")}>
            {caption}
          </p>
        )}
      </div>
    </>
  )

  const className = cn(
    "block rounded-card p-[18px]",
    featured ? "bg-[image:var(--gradient-highlight)] shadow-card" : "surface",
    attention && "border-l-[3px] border-l-destructive",
  )

  return href ? (
    <Link
      href={href}
      className={cn(
        className,
        "surface-hover outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
      )}
    >
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  )
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-card bg-card p-[18px] shadow-card">
      <Skeleton className="size-[35px] rounded-[10.5px]" />
      <Skeleton className="mt-[18px] h-3 w-24" />
      <Skeleton className="mt-2 h-7 w-16" />
    </div>
  )
}

/** Builds a delta chip from two values. `goodWhen` says which direction is an improvement. */
export function deltaFrom(
  current: number,
  previous: number | null,
  { goodWhen = "up", format = (n: number) => String(n) } = {} as {
    goodWhen?: "up" | "down"
    format?: (n: number) => string
  },
): StatCardProps["delta"] {
  if (previous === null) return undefined
  const diff = current - previous
  const direction = diff === 0 ? "flat" : diff > 0 ? "up" : "down"
  return {
    label: `${diff > 0 ? "+" : ""}${format(diff)}`,
    direction,
    positive: direction === "flat" || (goodWhen === "up" ? diff > 0 : diff < 0),
  }
}
