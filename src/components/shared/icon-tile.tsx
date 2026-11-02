import { cva, type VariantProps } from "class-variance-authority"
import { type LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

const iconTileVariants = cva("flex shrink-0 items-center justify-center [&_svg]:shrink-0", {
  variants: {
    tone: {
      default: "bg-icon-tile text-icon-tile-foreground",
      info: "bg-info-soft text-info-foreground",
      success: "bg-success-soft text-success-foreground",
      warning: "bg-warning-soft text-warning-foreground",
      danger: "bg-destructive-soft text-destructive-foreground",
      neutral: "bg-neutral-soft text-neutral-foreground",
    },
    size: {
      sm: "size-8 rounded-full [&_svg]:size-4",
      md: "size-9 rounded-xl [&_svg]:size-[18px]",
      lg: "size-10 rounded-xl [&_svg]:size-5",
    },
  },
  defaultVariants: { tone: "default", size: "md" },
})

interface IconTileProps extends VariantProps<typeof iconTileVariants> {
  icon: LucideIcon
  className?: string
}

/** Rounded icon container used by KPI cards, panel headers and alert rows. */
export function IconTile({ icon: Icon, tone, size, className }: IconTileProps) {
  return (
    <span className={cn(iconTileVariants({ tone, size }), className)}>
      <Icon aria-hidden />
    </span>
  )
}
