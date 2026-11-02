import { type LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

import { IconTile } from "./icon-tile"

/** Glossy content section with the large Buddii radius. Rises in on first render. */
export function Panel({ className, ...props }: React.ComponentProps<"section">) {
  return <section className={cn("rounded-panel surface p-6", className)} {...props} />
}

interface PanelHeaderProps {
  title: string
  description?: string
  icon?: LucideIcon
  iconTone?: React.ComponentProps<typeof IconTile>["tone"]
  /** Right-aligned link or control. */
  action?: React.ReactNode
  className?: string
}

export function PanelHeader({
  title,
  description,
  icon,
  iconTone = "info",
  action,
  className,
}: PanelHeaderProps) {
  return (
    <header className={cn("mb-5 flex items-center justify-between gap-4", className)}>
      <div className="flex min-w-0 items-center gap-3">
        {icon && <IconTile icon={icon} tone={iconTone} />}
        <div className="min-w-0">
          <h2 className="text-base leading-6 font-semibold text-heading">{title}</h2>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
      </div>
      {action}
    </header>
  )
}
