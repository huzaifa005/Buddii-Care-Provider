"use client"

import { cn } from "@/lib/utils"

export interface FilterOption<T extends string> {
  value: T
  label: string
  count?: number
}

interface FilterTabsProps<T extends string> {
  options: readonly FilterOption<T>[]
  value: T
  onChange: (value: T) => void
  label: string
  className?: string
}

/** Segmented filter. Pair with a `useQueryState` value so the filter survives reloads and links. */
export function FilterTabs<T extends string>({
  options,
  value,
  onChange,
  label,
  className,
}: FilterTabsProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className={cn("inline-flex flex-wrap gap-1 rounded-xl bg-card p-1 shadow-card", className)}
    >
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-[13px] font-medium transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {option.label}
            {option.count !== undefined && (
              <span
                className={cn(
                  "rounded-full px-1.5 text-[11px] tabular-nums",
                  active ? "bg-white/15" : "bg-muted",
                )}
              >
                {option.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
