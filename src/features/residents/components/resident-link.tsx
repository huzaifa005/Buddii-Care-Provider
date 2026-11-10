"use client"

import Link from "next/link"

import { useResidentName } from "../api"
import { type ResidentTab } from "../resident-tabs"

export function residentHref(residentId: string, tab?: ResidentTab) {
  const path = `/residents/${encodeURIComponent(residentId)}`
  return tab && tab !== "overview" ? `${path}?tab=${tab}` : path
}

/** Links to the resident profile, labelled with the resident's name. */
export function ResidentLink({
  residentId,
  tab,
  className,
  children,
}: {
  residentId: string
  tab?: ResidentTab
  className?: string
  children?: React.ReactNode
}) {
  const name = useResidentName(residentId)
  return (
    <Link href={residentHref(residentId, tab)} className={className}>
      {children ?? name}
    </Link>
  )
}
