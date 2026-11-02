import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

export const statusPillVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] leading-4 font-semibold whitespace-nowrap",
  {
    variants: {
      tone: {
        success: "bg-success-soft text-success-foreground",
        danger: "bg-destructive-soft text-destructive-foreground",
        warning: "bg-warning-soft text-warning-foreground",
        info: "bg-info-soft text-info-foreground",
        neutral: "bg-neutral-soft text-neutral-foreground",
      },
      caps: {
        true: "tracking-wide uppercase",
        false: "",
      },
    },
    defaultVariants: { tone: "neutral", caps: false },
  },
)

export type StatusTone = NonNullable<VariantProps<typeof statusPillVariants>["tone"]>

interface StatusPillProps extends VariantProps<typeof statusPillVariants> {
  children: React.ReactNode
  className?: string
}

export function StatusPill({ tone, caps, className, children }: StatusPillProps) {
  return <span className={cn(statusPillVariants({ tone, caps }), className)}>{children}</span>
}
