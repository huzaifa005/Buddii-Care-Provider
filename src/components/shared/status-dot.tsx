import { cn } from "@/lib/utils"

import { type StatusTone } from "./status-pill"

const dotClass: Record<StatusTone, string> = {
  success: "bg-success",
  danger: "bg-destructive",
  warning: "bg-warning",
  info: "bg-info",
  neutral: "bg-muted-foreground/50",
}

/** Quiet status: a small coloured dot with neutral text, for dense lists and tables. */
export function StatusDot({
  tone,
  children,
  className,
}: {
  tone: StatusTone
  children: React.ReactNode
  className?: string
}) {
  return (
    <span
      className={cn("inline-flex items-center gap-1.5 text-xs text-muted-foreground", className)}
    >
      <span className={cn("size-1.5 shrink-0 rounded-full", dotClass[tone])} aria-hidden />
      {children}
    </span>
  )
}
