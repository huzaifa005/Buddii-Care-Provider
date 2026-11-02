"use client"

import { LogOut, MessageSquareText, Settings } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Skeleton } from "@/components/ui/skeleton"
import { useLogout } from "@/features/auth/api"
import { EmergencyButton } from "@/features/safeguarding/components/emergency-contacts"
import { useSession } from "@/features/session/api"
import { PROVIDER_ROLE_LABELS } from "@/features/session/schemas"
import { initials } from "@/lib/format"

import { CommandMenu } from "./command-menu"
import { NotificationsMenu } from "./notifications-menu"

export function AppHeader() {
  const { data: session } = useSession()

  return (
    <header className="sticky top-0 z-10 flex h-[72px] shrink-0 items-center gap-3 border-b bg-card px-4 md:gap-[18px] md:px-9">
      <SidebarTrigger
        className="-ml-1 size-9 shrink-0 text-muted-foreground"
        aria-label="Toggle sidebar"
      />

      <div className="flex min-w-0 flex-1 items-center gap-3 md:gap-4">
        {session ? (
          <span className="hidden shrink-0 truncate text-base font-medium text-muted-foreground xl:block">
            {session.organisation.name}
          </span>
        ) : (
          <Skeleton className="hidden h-4 w-32 lg:block" />
        )}
        <CommandMenu />
      </div>

      <div className="flex items-center gap-1 md:gap-2">
        <EmergencyButton />
        <NotificationsMenu />
        <Button
          variant="ghost"
          size="icon"
          className="size-9 text-muted-foreground"
          aria-label="Messages"
          asChild
        >
          <Link href="/messages">
            <MessageSquareText className="size-5 text-success" aria-hidden />
          </Link>
        </Button>
        <div className="ml-2 flex h-11 items-center border-l pl-4 md:ml-3 md:pl-7">
          <UserMenu />
        </div>
      </div>
    </header>
  )
}

function UserMenu() {
  const router = useRouter()
  const { data: session } = useSession()
  const logout = useLogout()

  if (!session) return <Skeleton className="size-[45px] rounded-full" />
  const { user } = session

  const signOut = () =>
    logout.mutate(undefined, {
      onSuccess: () => router.replace("/login"),
      onError: () => toast.error("Could not sign out. Please try again."),
    })

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-3 rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
        <span className="hidden text-right leading-tight md:block">
          <span className="block text-base leading-5 font-semibold text-foreground">
            {user.displayName}
          </span>
          <span className="block text-sm leading-[19px] text-muted-foreground">
            {PROVIDER_ROLE_LABELS[user.role]}
          </span>
        </span>
        <Avatar className="size-[45px] border border-avatar-border">
          <AvatarFallback className="bg-avatar text-lg font-bold text-avatar-foreground">
            {initials(user.displayName)}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="font-normal">
          <p className="text-sm font-medium">{user.displayName}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {session.organisation.name} · {session.organisation.programme}
          </p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings?tab=notifications">
            <Settings aria-hidden />
            Notification settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={signOut} disabled={logout.isPending}>
          <LogOut aria-hidden />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
