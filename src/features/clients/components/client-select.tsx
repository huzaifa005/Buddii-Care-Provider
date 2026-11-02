"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { useClients } from "../api"

interface ClientSelectProps {
  value: string
  onChange: (value: string) => void
  id?: string
  invalid?: boolean
}

/** Buddii client picker for forms. Shows IDs and non-identifying context only. */
export function ClientSelect({ value, onChange, id, invalid }: ClientSelectProps) {
  const { data, isPending } = useClients()

  return (
    <Select value={value} onValueChange={onChange} disabled={isPending}>
      <SelectTrigger id={id} aria-invalid={invalid} className="h-10 w-full">
        <SelectValue placeholder={isPending ? "Loading residents…" : "Select a resident"} />
      </SelectTrigger>
      <SelectContent>
        {data?.results.map((client) => (
          <SelectItem key={client.id} value={client.id}>
            <span className="font-medium tabular-nums">{client.id}</span>
            <span className="text-muted-foreground">
              · {client.ageBand} · {client.postcodeDistrict}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
