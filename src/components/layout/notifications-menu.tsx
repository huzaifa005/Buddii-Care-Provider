"use client"

import {
  Bell,
  CheckCheck,
  ClipboardCheck,
  Inbox,
  MessageSquare,
  MessageSquareWarning,
  ShieldAlert,
} from "lucide-react"
import Link from "next/link"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Skeleton } from "@/components/ui/skeleton"
import { useMarkAllNotificationsRead, useNotifications } from "@/features/notifications/api"
import { type Notification } from "@/features/notifications/schemas"
import { formatDayMonth, formatTime } from "@/lib/format"
import { cn } from "@/lib/utils"

const ICON: Record<Notification["kind"], typeof Bell> = {
  ASSIGNMENT: Inbox,
  OBSERVATION: MessageSquareWarning,
  REQUEST: ClipboardCheck,
  SAFEGUARDING: ShieldAlert,
  MESSAGE: MessageSquare,
}

export function NotificationsMenu() {
  const [open, setOpen] = useState(false)
  const { data, isPending } = useNotifications()
  const markAll = useMarkAllNotificationsRead()
  const unread = data?.filter((n) => !n.read).length ?? 0

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative size-9 text-muted-foreground"
          aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
        >
          <Bell className="size-6" aria-hidden />
          {unread > 0 && (
            <span className="absolute top-1 right-1.5 flex size-[9px] rounded-full bg-notification-dot text-[0px] ring-2 ring-card">
              {unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 gap-0 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="text-sm font-semibold text-heading">Notifications</p>
          <Button
            variant="ghost"
            size="sm"
            disabled={unread === 0 || markAll.isPending}
            onClick={() => markAll.mutate()}
          >
            <CheckCheck aria-hidden />
            Mark all read
          </Button>
        </div>
        <ul className="max-h-96 overflow-y-auto">
          {isPending &&
            Array.from({ length: 3 }, (_, i) => (
              <li key={i} className="px-4 py-3">
                <Skeleton className="h-10" />
              </li>
            ))}
          {data?.length === 0 && (
            <li className="px-4 py-10 text-center text-sm text-muted-foreground">
              You&apos;re all caught up.
            </li>
          )}
          {data?.map((n) => {
            const Icon = ICON[n.kind]
            return (
              <li key={n.id} className="border-b last:border-b-0">
                <Link
                  href={n.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex gap-3 px-4 py-3 hover:bg-muted/60",
                    !n.read && "bg-accent/40",
                  )}
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-icon-tile text-icon-tile-foreground">
                    <Icon className="size-4" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start justify-between gap-2">
                      <span className="text-[13px] font-medium text-heading">{n.title}</span>
                      {!n.read && (
                        <span
                          className="mt-1.5 size-2 shrink-0 rounded-full bg-primary"
                          aria-label="Unread"
                        />
                      )}
                    </span>
                    <span className="block text-xs text-muted-foreground">{n.body}</span>
                    <span className="mt-1 block text-[11px] text-muted-foreground">
                      {formatDayMonth(n.createdAt)}, {formatTime(n.createdAt)}
                    </span>
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </PopoverContent>
    </Popover>
  )
}
