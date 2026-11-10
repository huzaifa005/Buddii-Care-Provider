"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { useResidents } from "../api"

interface ResidentSelectProps {
  value: string
  onChange: (value: string) => void
  id?: string
  invalid?: boolean
}

/** Resident picker for forms: name first, Buddii ID and area as context. */
export function ResidentSelect({ value, onChange, id, invalid }: ResidentSelectProps) {
  const { data, isPending } = useResidents()

  return (
    <Select value={value} onValueChange={onChange} disabled={isPending}>
      <SelectTrigger id={id} aria-invalid={invalid} className="h-10 w-full">
        <SelectValue placeholder={isPending ? "Loading residents…" : "Select a resident"} />
      </SelectTrigger>
      <SelectContent>
        {data?.results.map((resident) => (
          <SelectItem key={resident.id} value={resident.id}>
            <span className="font-medium">{resident.name}</span>
            <span className="text-muted-foreground tabular-nums">
              · {resident.id} · {resident.area}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
