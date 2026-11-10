"use client"

import { ChevronDown } from "lucide-react"
import { useLayoutEffect, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

const TAB =
  "h-9 flex-none rounded-lg px-3.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground hover:text-heading"
const ACTIVE = "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
const GAP = 4

/**
 * Tab row that never scrolls or clips (Council design system). Shows as many tabs as fit, up
 * to `max`, and puts the rest under "More". When the open tab is in More, the button shows its
 * name in the active style. Use inside `<Tabs>`.
 */
export function OverflowTabsList<T extends string>({
  items,
  value,
  onSelect,
  max = items.length,
  numbered = false,
}: {
  items: readonly (readonly [T, string])[]
  value: T
  onSelect: (value: T) => void
  max?: number
  numbered?: boolean
}) {
  const row = useRef<HTMLDivElement>(null)
  const ruler = useRef<HTMLDivElement>(null)
  const limit = Math.min(max, items.length)
  const [count, setCount] = useState(limit)
  const label = (i: number) => (numbered ? `${i + 1}. ${items[i]![1]}` : items[i]![1])

  useLayoutEffect(() => {
    const el = row.current
    const measure = ruler.current
    if (!el || !measure) return
    const fit = () => {
      const widths = [...measure.children].map((c) => (c as HTMLElement).offsetWidth)
      const more = widths.pop() ?? 0
      const available = el.clientWidth
      // Not laid out yet (or no layout, as in tests): show the full row.
      if (available === 0) return setCount(limit)
      let used = 0
      let n = 0
      for (let i = 0; i < limit; i++) {
        const next = used + (n ? GAP : 0) + widths[i]!
        const needsMore = i + 1 < items.length
        if (next + (needsMore ? GAP + more : 0) > available) break
        used = next
        n++
      }
      setCount(Math.max(1, n))
    }
    fit()
    if (typeof ResizeObserver === "undefined") return
    const observer = new ResizeObserver(fit)
    observer.observe(el)
    return () => observer.disconnect()
  }, [items, limit])

  const visible = items.slice(0, count)
  const hidden = items.slice(count)
  const activeHidden = hidden.find(([v]) => v === value)
  const longestHidden = items
    .map((_, i) => label(i))
    .reduce((a, b) => (b.length > a.length ? b : a), "More")

  return (
    <div ref={row} className="relative w-full min-w-0 overflow-hidden">
      {/* Off-screen ruler: the width of every tab, then of the widest "More" button. */}
      <div
        ref={ruler}
        aria-hidden
        className="pointer-events-none invisible absolute top-0 left-0 flex"
      >
        {items.map(([v], i) => (
          <span key={v} className={cn(TAB, "inline-flex items-center")}>
            {label(i)}
          </span>
        ))}
        <span className={cn(TAB, "inline-flex items-center gap-1.5")}>
          {longestHidden}
          <ChevronDown className="size-4" />
        </span>
      </div>

      <div className="flex w-max items-center gap-1">
        <TabsList className="h-auto w-max justify-start gap-1 bg-transparent p-0">
          {visible.map(([v], i) => (
            <TabsTrigger
              key={v}
              value={v}
              className={cn(
                TAB,
                "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground",
              )}
            >
              {label(i)}
            </TabsTrigger>
          ))}
        </TabsList>
        {/* Outside the tablist: a tablist may only contain tabs. */}
        {hidden.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className={cn(TAB, "gap-1.5", activeHidden && ACTIVE)}>
                {activeHidden ? label(items.indexOf(activeHidden)) : "More"}
                <ChevronDown aria-hidden />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {hidden.map(([v], i) => (
                <DropdownMenuItem
                  key={v}
                  onSelect={() => onSelect(v)}
                  className={cn(v === value && "font-semibold text-primary")}
                >
                  {label(count + i)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  )
}
