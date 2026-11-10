"use client"

import { Plus, Search, ShieldAlert, User } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"
import { Kbd } from "@/components/ui/kbd"
import { PORTAL_NAV } from "@/config/navigation"
import { useResidents } from "@/features/residents/api"
import { residentHref } from "@/features/residents/components/resident-link"

/** Global search and quick actions (Ctrl/Cmd + K). Searches Buddii IDs only, never names. */
export function CommandMenu() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  // Only fetch residents once the palette is opened.
  const residents = useResidents({}, { enabled: open })

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [])

  const go = (href: string) => {
    setOpen(false)
    router.push(href)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden h-11 w-full max-w-[360px] min-w-0 items-center gap-3 rounded-[9px] border bg-search px-3.5 text-base text-placeholder outline-none hover:border-ring/40 focus-visible:ring-[3px] focus-visible:ring-ring/50 md:flex"
      >
        <Search className="size-[18px] text-muted-foreground" aria-hidden />
        <span className="flex-1 truncate text-left">Search residents, pages…</span>
        <Kbd className="hidden lg:inline-flex">Ctrl K</Kbd>
      </button>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted md:hidden"
        aria-label="Search"
      >
        <Search className="size-5" aria-hidden />
      </button>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Search"
        description="Find a resident, page or action"
      >
        {/* The shadcn dialog does not provide the cmdk root; it must wrap the input and list. */}
        <Command>
          <CommandInput placeholder="Type a name, Buddii ID, page or action…" />
          <CommandList>
            <CommandEmpty>No results.</CommandEmpty>
            <CommandGroup heading="Actions">
              <CommandItem onSelect={() => go("/support-requests?new=true")}>
                <Plus aria-hidden />
                New support request
              </CommandItem>
              <CommandItem onSelect={() => go("/safeguarding?report=true")}>
                <ShieldAlert aria-hidden />
                Report a safeguarding concern
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Pages">
              {PORTAL_NAV.map((item) => (
                <CommandItem
                  key={item.id}
                  value={`page ${item.title}`}
                  onSelect={() => go(item.href)}
                >
                  <item.icon aria-hidden />
                  {item.title}
                </CommandItem>
              ))}
            </CommandGroup>
            {residents.data && (
              <>
                <CommandSeparator />
                <CommandGroup heading="Residents">
                  {residents.data.results.map((c) => (
                    <CommandItem
                      key={c.id}
                      value={`${c.name} ${c.id} ${c.area} ${c.supportGoals.join(" ")}`}
                      onSelect={() => go(residentHref(c.id))}
                    >
                      <User aria-hidden />
                      <span>{c.name}</span>
                      <CommandShortcut className="tabular-nums">
                        {c.id} · {c.area}
                      </CommandShortcut>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  )
}
