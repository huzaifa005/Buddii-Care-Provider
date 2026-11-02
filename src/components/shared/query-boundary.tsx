"use client"

import { type UseQueryResult } from "@tanstack/react-query"
import { RefreshCw, TriangleAlert } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

import { Panel } from "./panel"

interface QueryBoundaryProps<T> {
  query: UseQueryResult<T>
  fallback: React.ReactNode
  children: (data: T) => React.ReactNode
  errorTitle?: string
}

/** Renders a query's loading, error and success states consistently across screens. */
export function QueryBoundary<T>({ query, fallback, children, errorTitle }: QueryBoundaryProps<T>) {
  if (query.isPending) return fallback
  if (query.isError) {
    return (
      <Panel>
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <TriangleAlert />
            </EmptyMedia>
            <EmptyTitle>{errorTitle ?? "This couldn't be loaded"}</EmptyTitle>
            <EmptyDescription>Check your connection and try again.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={() => query.refetch()} disabled={query.isRefetching}>
              <RefreshCw className={query.isRefetching ? "animate-spin" : undefined} aria-hidden />
              Try again
            </Button>
          </EmptyContent>
        </Empty>
      </Panel>
    )
  }
  return children(query.data)
}

/** Friendly empty state for lists and filtered views. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <Empty className="py-12">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Icon />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        {description && <EmptyDescription>{description}</EmptyDescription>}
      </EmptyHeader>
      {action && <EmptyContent>{action}</EmptyContent>}
    </Empty>
  )
}
