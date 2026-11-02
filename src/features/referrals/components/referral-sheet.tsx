"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Info, TriangleAlert } from "lucide-react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
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
import { SUPPORT_TYPES } from "@/features/support-requests/schemas"
import { ApiError } from "@/lib/api/client"

import { useSubmitReferral } from "../api"
import { AGE_BANDS, type NewReferral, type NewReferralInput, newReferralSchema } from "../schemas"

const EMPTY: NewReferralInput = {
  providerRef: "",
  ageBand: "" as NewReferralInput["ageBand"],
  postcodeDistrict: "",
  supportTypes: [],
  reason: "",
  consentConfirmed: false,
}

export function ReferralSheet({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const mutation = useSubmitReferral()
  const form = useForm<NewReferralInput, unknown, NewReferral>({
    resolver: zodResolver(newReferralSchema),
    defaultValues: EMPTY,
  })

  const close = () => {
    onOpenChange(false)
    form.reset(EMPTY)
  }

  const onSubmit = form.handleSubmit(async (input) => {
    try {
      const created = await mutation.mutateAsync(input)
      toast.success("Referral sent to the council", {
        description: `${created.id} is with the council for review. You will be told when it is decided.`,
      })
      close()
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not send the referral")
    }
  })

  return (
    <Sheet open={open} onOpenChange={(next) => (next ? onOpenChange(true) : close())}>
      <SheetContent className="gap-0 data-[side=right]:w-full data-[side=right]:sm:max-w-xl">
        <SheetHeader className="border-b px-6 py-5">
          <SheetTitle className="text-lg text-heading">Refer a resident</SheetTitle>
          <SheetDescription>
            Ask the council to add a resident to the Buddii programme. The council reviews the
            referral and creates the resident record.
          </SheetDescription>
        </SheetHeader>

        <form
          id="new-referral"
          onSubmit={onSubmit}
          className="flex-1 space-y-5 overflow-y-auto px-6 py-6"
        >
          <div className="flex gap-2.5 rounded-lg bg-warning-soft px-3 py-2.5 text-xs leading-relaxed text-warning-foreground">
            <TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            <p>
              <span className="font-semibold">Do not enter</span> the resident&apos;s name, address,
              date of birth, medication, diagnosis, care plan or keysafe code. The council collects
              identity details directly.
            </p>
          </div>

          <Controller
            control={form.control}
            name="providerRef"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="rf-ref">Your reference</FieldLabel>
                <Input
                  id="rf-ref"
                  {...field}
                  className="h-10"
                  aria-invalid={fieldState.invalid}
                  placeholder="e.g. your internal record number"
                  autoComplete="off"
                />
                <FieldDescription>
                  Lets the council match this referral to your records. Not a name.
                </FieldDescription>
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <Controller
              control={form.control}
              name="ageBand"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="rf-age">Age band</FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger
                      id="rf-age"
                      aria-invalid={fieldState.invalid}
                      className="h-10 w-full"
                    >
                      <SelectValue placeholder="Select…" />
                    </SelectTrigger>
                    <SelectContent>
                      {AGE_BANDS.map((band) => (
                        <SelectItem key={band} value={band}>
                          {band}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="postcodeDistrict"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="rf-postcode">Postcode district</FieldLabel>
                  <Input
                    id="rf-postcode"
                    {...field}
                    className="h-10 uppercase placeholder:normal-case"
                    aria-invalid={fieldState.invalid}
                    placeholder="e.g. E6"
                    autoComplete="off"
                  />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
          </div>

          <Controller
            control={form.control}
            name="supportTypes"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel id="rf-types">Support that would help</FieldLabel>
                <div role="group" aria-labelledby="rf-types" className="grid gap-2 sm:grid-cols-2">
                  {SUPPORT_TYPES.map((type) => {
                    const checked = field.value.includes(type)
                    return (
                      <label
                        key={type}
                        className="flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2 text-[13px] has-data-[state=checked]:border-primary has-data-[state=checked]:bg-accent/50"
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(next) =>
                            field.onChange(
                              next === true
                                ? [...field.value, type]
                                : field.value.filter((t) => t !== type),
                            )
                          }
                        />
                        {type}
                      </label>
                    )
                  })}
                </div>
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />

          <Controller
            control={form.control}
            name="reason"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="rf-reason">Why volunteer support would help</FieldLabel>
                <Textarea
                  id="rf-reason"
                  {...field}
                  rows={4}
                  aria-invalid={fieldState.invalid}
                  placeholder="e.g. Lives alone and has said they would like regular company."
                />
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />

          <p className="flex gap-2 rounded-lg bg-info-soft px-3 py-2.5 text-xs leading-relaxed text-info-foreground">
            <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            Buddii is a volunteering programme. Personal care, medication and clinical tasks are out
            of scope.
          </p>

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
                  <span className="text-[13px]">
                    The resident has agreed to be referred to the Buddii programme and to the
                    council contacting them.
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
          <Button type="submit" form="new-referral" disabled={mutation.isPending}>
            {mutation.isPending && <Spinner />}
            Send to council
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
