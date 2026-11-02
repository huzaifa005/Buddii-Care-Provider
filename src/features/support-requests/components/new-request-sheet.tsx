"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Info } from "lucide-react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { ClientSelect } from "@/features/clients/components/client-select"
import { ApiError } from "@/lib/api/client"

import { useCreateSupportRequest } from "../api"
import { FREQUENCY_LABEL, TIME_LABEL } from "../presentation"
import {
  type NewSupportRequest,
  type NewSupportRequestInput,
  newSupportRequestSchema,
  SUPPORT_TYPES,
} from "../schemas"

export function NewRequestSheet({
  open,
  onOpenChange,
  defaultClientId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultClientId?: string
}) {
  const mutation = useCreateSupportRequest()
  const form = useForm<NewSupportRequestInput, unknown, NewSupportRequest>({
    resolver: zodResolver(newSupportRequestSchema),
    values: {
      clientId: defaultClientId ?? "",
      type: "",
      goal: "",
      frequency: "WEEKLY",
      preferredTime: "EITHER",
      context: "",
      riskLevel: "STANDARD",
      consentConfirmed: false,
    },
  })

  const close = () => {
    onOpenChange(false)
    form.reset()
  }

  const onSubmit = form.handleSubmit(async (input) => {
    try {
      const created = await mutation.mutateAsync(input)
      toast.success("Support request submitted", {
        description: `${created.id} is with the Volunteer Coordinator for review.`,
      })
      close()
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not submit the request")
    }
  })

  return (
    <Sheet open={open} onOpenChange={(next) => (next ? onOpenChange(true) : close())}>
      <SheetContent className="gap-0 data-[side=right]:w-full data-[side=right]:sm:max-w-xl">
        <SheetHeader className="border-b px-6 py-5">
          <SheetTitle className="text-lg text-heading">New support request</SheetTitle>
          <SheetDescription>
            Ask the Volunteer Coordinator to match a volunteer for one of your residents.
          </SheetDescription>
        </SheetHeader>

        <form
          id="new-request"
          onSubmit={onSubmit}
          className="flex-1 space-y-5 overflow-y-auto px-6 py-6"
        >
          <p className="flex gap-2 rounded-lg bg-info-soft px-3 py-2.5 text-xs leading-relaxed text-info-foreground">
            <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            Only companionship, wellbeing, social and light practical support can be requested.
            Personal care, medication and clinical tasks are out of scope.
          </p>

          <div className="grid gap-5 sm:grid-cols-2">
            <Controller
              control={form.control}
              name="clientId"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="nr-client">Resident</FieldLabel>
                  <ClientSelect
                    id="nr-client"
                    value={field.value}
                    onChange={field.onChange}
                    invalid={fieldState.invalid}
                  />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="type"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="nr-type">Type of support</FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger
                      id="nr-type"
                      aria-invalid={fieldState.invalid}
                      className="h-10 w-full"
                    >
                      <SelectValue placeholder="Select…" />
                    </SelectTrigger>
                    <SelectContent>
                      {SUPPORT_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
          </div>

          <Controller
            control={form.control}
            name="goal"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="nr-goal">Goal for this support</FieldLabel>
                <Input
                  id="nr-goal"
                  {...field}
                  className="h-10"
                  aria-invalid={fieldState.invalid}
                  placeholder="e.g. Reduce isolation through weekly companionship"
                />
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />

          <div className="grid gap-5 sm:grid-cols-2">
            {(
              [
                ["frequency", "Frequency", FREQUENCY_LABEL],
                ["preferredTime", "Preferred time", TIME_LABEL],
              ] as const
            ).map(([name, label, options]) => (
              <Controller
                key={name}
                control={form.control}
                name={name}
                render={({ field }) => (
                  <Field>
                    <FieldLabel htmlFor={`nr-${name}`}>{label}</FieldLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id={`nr-${name}`} className="h-10 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(options).map(([value, text]) => (
                          <SelectItem key={value} value={value}>
                            {text}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              />
            ))}
          </div>

          <Controller
            control={form.control}
            name="context"
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor="nr-context">Volunteer-safe context</FieldLabel>
                <Textarea
                  id="nr-context"
                  {...field}
                  rows={4}
                  placeholder="Interests, communication needs, what to expect on arrival."
                />
                <FieldDescription>
                  Shared with the matched volunteer. Do not include medication, diagnoses, care
                  plans or keysafe codes.
                </FieldDescription>
              </Field>
            )}
          />

          <Controller
            control={form.control}
            name="riskLevel"
            render={({ field }) => (
              <Field>
                <FieldLabel>Risk level</FieldLabel>
                <RadioGroup
                  value={field.value}
                  onValueChange={field.onChange}
                  className="grid grid-cols-2 gap-2"
                >
                  {(
                    [
                      ["STANDARD", "Standard", "Usual volunteer guidance"],
                      ["ELEVATED", "Elevated", "Coordinator briefs the volunteer"],
                    ] as const
                  ).map(([value, label, hint]) => (
                    <label
                      key={value}
                      className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 has-data-[state=checked]:border-primary has-data-[state=checked]:bg-accent/50"
                    >
                      <RadioGroupItem value={value} className="mt-0.5" />
                      <span>
                        <span className="block text-sm font-medium">{label}</span>
                        <span className="block text-xs text-muted-foreground">{hint}</span>
                      </span>
                    </label>
                  ))}
                </RadioGroup>
              </Field>
            )}
          />

          <Controller
            control={form.control}
            name="consentConfirmed"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <label className="flex items-start gap-3 rounded-lg border p-3">
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(checked) => field.onChange(checked === true)}
                    aria-invalid={fieldState.invalid}
                    className="mt-0.5"
                  />
                  <span className="text-sm">
                    The resident has consented to volunteer support and to this information being
                    shared with the coordinator.
                  </span>
                </label>
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />
        </form>

        <SheetFooter className="flex-row justify-end border-t px-6 py-4">
          <Button variant="outline" onClick={close}>
            Cancel
          </Button>
          <Button type="submit" form="new-request" disabled={mutation.isPending}>
            {mutation.isPending && <Spinner />}
            Submit to coordinator
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
