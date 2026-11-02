"use client"

import { Phone, ShieldAlert, Siren } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useCan } from "@/features/session/api"

const CONTACTS = [
  { label: "Emergency services", detail: "Police, ambulance, fire", number: "999" },
  {
    label: "Newham adult safeguarding",
    detail: "24/7, including out of hours",
    number: "020 8430 2000",
  },
  { label: "NHS non-emergency", detail: "Medical advice", number: "111" },
]

/** Tap-to-call list. Used on the Safeguarding page and in the emergency dialog. */
export function EmergencyContactList() {
  return (
    <ul className="space-y-2">
      {CONTACTS.map((c) => (
        <li key={c.number}>
          <a
            href={`tel:${c.number.replaceAll(" ", "")}`}
            className="flex items-center justify-between gap-3 rounded-lg border px-4 py-3 outline-none hover:bg-muted/60 focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <span>
              <span className="block text-sm font-medium">{c.label}</span>
              <span className="block text-xs text-muted-foreground">{c.detail}</span>
            </span>
            <span className="flex shrink-0 items-center gap-1.5 text-sm font-semibold whitespace-nowrap text-heading tabular-nums">
              <Phone className="size-3.5" aria-hidden />
              {c.number}
            </span>
          </a>
        </li>
      ))}
    </ul>
  )
}

/**
 * Topbar button on every screen (v10 section 5): staff on a vulnerable person's record must
 * never have to search for emergency numbers.
 */
export function EmergencyButton() {
  const [open, setOpen] = useState(false)
  const canReport = useCan("safeguarding.report")

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="border-destructive/30 text-destructive-foreground hover:bg-destructive-soft hover:text-destructive-foreground"
        aria-label="Emergency contacts"
      >
        <Siren aria-hidden />
        <span className="hidden sm:inline">Emergency</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-heading">
              <Siren className="size-5 text-destructive" aria-hidden />
              Emergency contacts
            </DialogTitle>
            <DialogDescription>
              Buddii is not an emergency service. If someone is in immediate danger, call 999 first.
            </DialogDescription>
          </DialogHeader>
          <EmergencyContactList />
          {canReport && (
            <DialogFooter>
              <Button asChild variant="outline" onClick={() => setOpen(false)}>
                <Link href="/safeguarding?report=true">
                  <ShieldAlert aria-hidden />
                  Report a safeguarding concern
                </Link>
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
