"use client"

import { useEffect, useState } from "react"

const NUMERIC = /^(\d{1,3}(,\d{3})*|\d+)(\.(\d+))?$/

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  )
}

/**
 * Counts a KPI up from zero on first render. Formatted numbers such as "1,234" or "3.8" keep
 * their format; anything else (e.g. "4 of 6") renders unchanged.
 */
export function AnimatedValue({
  value,
  duration = 900,
}: {
  value: React.ReactNode
  duration?: number
}) {
  const text = typeof value === "number" ? String(value) : typeof value === "string" ? value : null
  const match = text ? NUMERIC.exec(text) : null
  const target = match ? Number(text!.replaceAll(",", "")) : null
  const decimals = match?.[4]?.length ?? 0
  // Start at zero so the first paint does not flash the final value.
  const [current, setCurrent] = useState<number | null>(target === null ? null : 0)

  useEffect(() => {
    if (target === null) return
    // Reduced motion: jump straight to the value on the first frame.
    const ms = prefersReducedMotion() ? 0 : duration
    let frame = 0
    const start = performance.now()
    const tick = (now: number) => {
      const progress = ms === 0 ? 1 : Math.min(1, (now - start) / ms)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCurrent(target * eased)
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target, duration])

  if (target === null || current === null) return <>{value}</>
  const formatted = current.toLocaleString("en-GB", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping: text!.includes(","),
  })
  return (
    <>
      {/* Screen readers get the final value, not every frame. */}
      <span aria-hidden>{formatted}</span>
      <span className="sr-only">{value}</span>
    </>
  )
}
