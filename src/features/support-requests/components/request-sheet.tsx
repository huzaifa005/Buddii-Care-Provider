"use client"

import { useState } from "react"

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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Spinner } from "@/components/ui/spinner"
import { ResidentLink } from "@/features/residents/components/resident-link"
import { formatDate } from "@/lib/format"

import { FREQUENCY_LABEL, REQUEST_STATUS, TIME_LABEL } from "../presentation"
import { type SupportRequest } from "../schemas"

/** Support request detail (Council pattern: Sheet for detail, Dialog to confirm). */
export function RequestSheet({
  request,
  onClose,
  canCancel,
  cancelling,
  onCancel,
}: {
  request: SupportRequest | null
  onClose: () => void
  canCancel: boolean
  cancelling: boolean
  onCancel: (id: string) => Promise<void>
}) {
  const [confirming, setConfirming] = useState(false)
  const cancellable =
    request !== null &&
    canCancel &&
    (request.status === "COORDINATOR_REVIEW" || request.status === "MATCHING")

  return (
    <>
      <Sheet open={request !== null} onOpenChange={(open) => !open && onClose()}>
        <SheetContent className="gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-[520px]">
          {request && (
            <>
              <SheetHeader className="border-b px-6 py-5">
                <SheetTitle className="text-xl font-bold text-heading">{request.type}</SheetTitle>
                <SheetDescription>
                  {request.id} · created {formatDate(request.createdAt)}
                </SheetDescription>
              </SheetHeader>
              <dl className="flex-1 divide-y overflow-y-auto px-6 py-2 text-[13px]">
                {(
                  [
                    [
                      "Resident",
                      <ResidentLink
                        key="r"
                        residentId={request.residentId}
                        className="font-medium text-heading hover:underline"
                      />,
                    ],
                    [
                      "Status",
                      <StatusDot key="s" tone={REQUEST_STATUS[request.status].tone}>
                        {REQUEST_STATUS[request.status].label}
                      </StatusDot>,
                    ],
                    ["Goal", request.goal],
                    ["How often", FREQUENCY_LABEL[request.frequency]],
                    ["Preferred time", TIME_LABEL[request.preferredTime]],
                    ["Risk level", request.riskLevel === "ELEVATED" ? "Elevated" : "Standard"],
                    ["Volunteer", request.volunteerRef ?? "Not yet matched"],
                    [
                      "Review date",
                      request.reviewDate ? formatDate(request.reviewDate) : "Not set",
                    ],
                  ] as const
                ).map(([k, v]) => (
                  <div key={k} className="grid grid-cols-[140px_1fr] gap-4 py-3">
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className="font-medium text-heading">{v}</dd>
                  </div>
                ))}
              </dl>
              {cancellable && (
                <div className="flex justify-end border-t px-6 py-4">
                  <Button variant="outline" onClick={() => setConfirming(true)}>
                    Cancel request
                  </Button>
                </div>
              )}
            </>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={confirming} onOpenChange={setConfirming}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel {request?.id}?</DialogTitle>
            <DialogDescription>
              The coordinator stops looking for a volunteer for this request. You can submit a new
              request at any time.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirming(false)}>
              Keep request
            </Button>
            <Button
              variant="destructive"
              disabled={cancelling}
              onClick={async () => {
                if (!request) return
                await onCancel(request.id)
                setConfirming(false)
                onClose()
              }}
            >
              {cancelling && <Spinner />}
              Cancel request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
