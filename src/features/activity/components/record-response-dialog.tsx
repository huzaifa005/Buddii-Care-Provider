"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { useResidentName } from "@/features/residents/api"
import { ApiError } from "@/lib/api/client"

import { useRecordResponse } from "../api"
import {
  type ActivityRecord,
  type ProviderResponseInput,
  providerResponseInputSchema,
} from "../schemas"

const FOLLOW_UPS: { value: ProviderResponseInput["followUp"]; label: string; hint: string }[] = [
  { value: "NONE", label: "No follow-up needed", hint: "Noted, nothing further to do" },
  {
    value: "WELFARE_CHECK",
    label: "Request a welfare check",
    hint: "Coordinator arranges an extra visit",
  },
  {
    value: "COORDINATOR_REVIEW",
    label: "Ask the coordinator to review",
    hint: "Shared in your coordinator thread",
  },
  {
    value: "SAFEGUARDING",
    label: "Raise a safeguarding concern",
    hint: "You'll be taken to the report form",
  },
]

export function RecordResponseDialog({
  record,
  onOpenChange,
}: {
  record: ActivityRecord | null
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const mutation = useRecordResponse()
  const form = useForm<ProviderResponseInput>({
    resolver: zodResolver(providerResponseInputSchema),
    defaultValues: { response: "", followUp: "NONE" },
  })

  const residentName = useResidentName(record?.residentId)

  const close = () => {
    onOpenChange(false)
    form.reset()
  }

  const onSubmit = form.handleSubmit(async (input) => {
    if (!record) return
    try {
      await mutation.mutateAsync({ id: record.id, input })
      toast.success("Response recorded", {
        description: `Shared with the coordinator for ${residentName}.`,
      })
      close()
      if (input.followUp === "SAFEGUARDING") {
        router.push(`/safeguarding?report=true&for=${record.residentId}`)
      }
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not save your response")
    }
  })

  return (
    <Dialog open={record !== null} onOpenChange={(open) => !open && close()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Respond to observation</DialogTitle>
          <DialogDescription>
            {record?.residentId} · {record?.type} · {record?.volunteerRef}
          </DialogDescription>
        </DialogHeader>

        {record?.observation && (
          <blockquote className="rounded-lg border-l-2 border-primary/30 bg-muted px-4 py-3 text-sm leading-relaxed text-foreground">
            {record.observation}
          </blockquote>
        )}

        <form id="record-response" onSubmit={onSubmit} className="space-y-5">
          <Controller
            control={form.control}
            name="followUp"
            render={({ field }) => (
              <Field>
                <FieldLabel>Follow-up</FieldLabel>
                <RadioGroup value={field.value} onValueChange={field.onChange} className="gap-2">
                  {FOLLOW_UPS.map((option) => (
                    <label
                      key={option.value}
                      className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 has-data-[state=checked]:border-primary has-data-[state=checked]:bg-accent/50"
                    >
                      <RadioGroupItem value={option.value} className="mt-0.5" />
                      <span>
                        <span className="block text-sm font-medium">{option.label}</span>
                        <span className="block text-xs text-muted-foreground">{option.hint}</span>
                      </span>
                    </label>
                  ))}
                </RadioGroup>
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="response"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="response">Your response</FieldLabel>
                <Textarea
                  id="response"
                  {...field}
                  rows={4}
                  aria-invalid={fieldState.invalid}
                  placeholder="What you have done or will do. Use Buddii IDs only."
                />
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={close}>
            Cancel
          </Button>
          <Button type="submit" form="record-response" disabled={mutation.isPending}>
            {mutation.isPending && <Spinner />}
            Save response
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
