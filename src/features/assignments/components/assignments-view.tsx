"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { differenceInCalendarDays, parseISO } from "date-fns"
import { Check, Inbox, Info, MapPin, Send, X } from "lucide-react"
import { parseAsBoolean, parseAsStringLiteral, useQueryState } from "nuqs"
import { useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"

import { FilterTabs } from "@/components/shared/filter-tabs"
import { PageHeader } from "@/components/shared/page-header"
import { Panel } from "@/components/shared/panel"
import { EmptyState, QueryBoundary } from "@/components/shared/query-boundary"
import { StatusDot } from "@/components/shared/status-dot"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldLabel } from "@/components/ui/field"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { ReferralSheet } from "@/features/referrals/components/referral-sheet"
import { ReferralsPanel } from "@/features/referrals/components/referrals-panel"
import { useCan } from "@/features/session/api"
import { ApiError } from "@/lib/api/client"
import { formatDate } from "@/lib/format"

import { useAssignments, useRespondToAssignment } from "../api"
import {
  type Assignment,
  type ConfirmAssignmentInput,
  confirmAssignmentInputSchema,
  DECLINE_REASONS,
  type DeclineAssignmentInput,
  declineAssignmentInputSchema,
} from "../schemas"

const STATUSES = ["PENDING", "CONFIRMED", "DECLINED"] as const

function daysAgo(date: string) {
  const days = differenceInCalendarDays(new Date(), parseISO(date))
  return days <= 0 ? "today" : `${days} ${days === 1 ? "day" : "days"} ago`
}

export function AssignmentsView() {
  const [status, setStatus] = useQueryState(
    "status",
    parseAsStringLiteral(STATUSES).withDefault("PENDING"),
  )
  const query = useAssignments(status)
  const [confirming, setConfirming] = useState<Assignment | null>(null)
  const [declining, setDeclining] = useState<Assignment | null>(null)
  const canRespond = useCan("assignments.respond")
  const canRefer = useCan("referrals.create")
  const [referring, setReferring] = useQueryState("refer", parseAsBoolean.withDefault(false))

  return (
    <div className="space-y-6">
      <PageHeader
        title="New Assignments"
        description="Residents the council has assigned to your organisation, and residents you refer to the council"
        actions={
          canRefer && (
            <Button className="h-10 px-4" onClick={() => setReferring(true)}>
              <Send aria-hidden />
              Refer a resident
            </Button>
          )
        }
      />

      <p className="flex items-start gap-2.5 rounded-card bg-info-soft px-4 py-3 text-sm text-info-foreground">
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
        Confirming an assignment means taking part in the Buddii volunteering programme for this
        resident. It is not a regulated care commissioning acceptance.
      </p>

      <FilterTabs
        label="Assignment status"
        value={status}
        onChange={(v) => setStatus(v === "PENDING" ? null : v)}
        options={[
          { value: "PENDING", label: "Awaiting response", count: query.data?.counts.PENDING },
          { value: "CONFIRMED", label: "Confirmed", count: query.data?.counts.CONFIRMED },
          { value: "DECLINED", label: "Declined", count: query.data?.counts.DECLINED },
        ]}
      />

      <QueryBoundary
        query={query}
        fallback={
          <div className="grid gap-4 lg:grid-cols-2">
            <Skeleton className="h-56 rounded-card" />
            <Skeleton className="h-56 rounded-card" />
          </div>
        }
      >
        {(data) =>
          data.results.length === 0 ? (
            <Panel>
              <EmptyState
                icon={Inbox}
                title={status === "PENDING" ? "No assignments waiting" : "Nothing here yet"}
                description="New council assignments will appear here and on your Home page."
              />
            </Panel>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {data.results.map((a) => (
                <article
                  key={a.id}
                  className="flex flex-col rounded-card surface p-6 surface-hover"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-lg font-semibold text-heading tabular-nums">{a.id}</p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="size-3.5" aria-hidden />
                        Age {a.ageBand} · {a.postcodeDistrict} · Council ref {a.councilRef}
                      </p>
                    </div>
                    {a.status === "PENDING" ? (
                      <StatusDot tone="warning">Received {daysAgo(a.receivedAt)}</StatusDot>
                    ) : (
                      <StatusDot tone={a.status === "CONFIRMED" ? "success" : "neutral"}>
                        {a.status === "CONFIRMED" ? "Confirmed" : "Declined"}{" "}
                        {a.respondedAt && formatDate(a.respondedAt)}
                      </StatusDot>
                    )}
                  </div>

                  <p className="mt-4 text-sm leading-relaxed text-foreground">{a.context}</p>

                  <div className="mt-4">
                    <p className="mb-2 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                      Programme goals
                    </p>
                    <ul className="flex flex-wrap gap-1.5">
                      {a.goals.map((g) => (
                        <li key={g} className="rounded-md bg-muted px-2 py-1 text-xs">
                          {g}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {a.declineReason && (
                    <p className="mt-4 text-xs text-muted-foreground">Reason: {a.declineReason}</p>
                  )}

                  {a.status === "PENDING" && !canRespond && (
                    <p className="mt-6 border-t pt-5 text-xs text-muted-foreground">
                      A Provider Coordinator or Administrator needs to confirm or decline this
                      assignment.
                    </p>
                  )}

                  {a.status === "PENDING" && canRespond && (
                    <div className="mt-6 flex gap-2 border-t pt-5">
                      <Button className="h-10 flex-1" onClick={() => setConfirming(a)}>
                        <Check aria-hidden />
                        Confirm participation
                      </Button>
                      <Button variant="outline" className="h-10" onClick={() => setDeclining(a)}>
                        <X aria-hidden />
                        Decline
                      </Button>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )
        }
      </QueryBoundary>

      <ReferralsPanel />

      <ConfirmDialog assignment={confirming} onClose={() => setConfirming(null)} />
      <ReferralSheet
        open={referring && canRefer}
        onOpenChange={(next) => void setReferring(next ? true : null)}
      />
      <DeclineDialog assignment={declining} onClose={() => setDeclining(null)} />
    </div>
  )
}

function ConfirmDialog({
  assignment,
  onClose,
}: {
  assignment: Assignment | null
  onClose: () => void
}) {
  const mutation = useRespondToAssignment()
  const form = useForm<ConfirmAssignmentInput>({
    resolver: zodResolver(confirmAssignmentInputSchema),
    defaultValues: { contact: "PROVIDER_COORDINATOR", notes: "" },
  })

  const onSubmit = form.handleSubmit(async (input) => {
    if (!assignment) return
    try {
      await mutation.mutateAsync({ id: assignment.id, decision: "confirm", input })
      toast.success("Participation confirmed", {
        description: `${assignment.id} will appear in Residents once the council creates the record.`,
      })
      form.reset()
      onClose()
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not confirm")
    }
  })

  return (
    <Dialog open={assignment !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm programme participation</DialogTitle>
          <DialogDescription>
            {assignment?.id} · Age {assignment?.ageBand} · {assignment?.postcodeDistrict}
          </DialogDescription>
        </DialogHeader>
        <form id="confirm-assignment" onSubmit={onSubmit} className="space-y-5">
          <Controller
            control={form.control}
            name="contact"
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor="ca-contact">Assigned contact</FieldLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="ca-contact" className="h-10 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PROVIDER_COORDINATOR">Provider Coordinator</SelectItem>
                    <SelectItem value="PROVIDER_ADMINISTRATOR">Provider Administrator</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="notes"
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor="ca-notes">Notes for the coordinator (optional)</FieldLabel>
                <Textarea
                  id="ca-notes"
                  rows={3}
                  {...field}
                  placeholder="Anything they should know"
                />
              </Field>
            )}
          />
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="confirm-assignment" disabled={mutation.isPending}>
            {mutation.isPending && <Spinner />}
            Confirm participation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function DeclineDialog({
  assignment,
  onClose,
}: {
  assignment: Assignment | null
  onClose: () => void
}) {
  const mutation = useRespondToAssignment()
  const form = useForm<DeclineAssignmentInput>({
    resolver: zodResolver(declineAssignmentInputSchema),
    defaultValues: { reason: DECLINE_REASONS[0], notes: "" },
  })

  const onSubmit = form.handleSubmit(async (input) => {
    if (!assignment) return
    try {
      await mutation.mutateAsync({ id: assignment.id, decision: "decline", input })
      toast.success("Assignment declined", { description: "The council has been notified." })
      form.reset()
      onClose()
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not decline")
    }
  })

  return (
    <Dialog open={assignment !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Decline assignment</DialogTitle>
          <DialogDescription>
            {assignment?.id} goes back to the council to be offered to another provider.
          </DialogDescription>
        </DialogHeader>
        <form id="decline-assignment" onSubmit={onSubmit} className="space-y-5">
          <Controller
            control={form.control}
            name="reason"
            render={({ field }) => (
              <Field>
                <FieldLabel>Reason</FieldLabel>
                <RadioGroup value={field.value} onValueChange={field.onChange} className="gap-2">
                  {DECLINE_REASONS.map((reason) => (
                    <label
                      key={reason}
                      className="flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm has-data-[state=checked]:border-primary"
                    >
                      <RadioGroupItem value={reason} />
                      {reason}
                    </label>
                  ))}
                </RadioGroup>
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="notes"
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor="da-notes">Notes for the council (optional)</FieldLabel>
                <Textarea id="da-notes" rows={3} {...field} />
              </Field>
            )}
          />
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="decline-assignment"
            variant="destructive"
            disabled={mutation.isPending}
          >
            {mutation.isPending && <Spinner />}
            Decline and return
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
