import Link from "next/link"

import { type ClientTab } from "../resident-tabs"

export function residentHref(clientId: string, tab?: ClientTab) {
  const path = `/residents/${encodeURIComponent(clientId)}`
  return tab && tab !== "overview" ? `${path}?tab=${tab}` : path
}

/** Links a Buddii ID to the resident profile page. */
export function ClientLink({
  clientId,
  tab,
  className,
  children,
}: {
  clientId: string
  tab?: ClientTab
  className?: string
  children?: React.ReactNode
}) {
  return (
    <Link href={residentHref(clientId, tab)} className={className}>
      {children ?? clientId}
    </Link>
  )
}
