"use client"

import { FileText, MoreHorizontal, Paperclip, Upload } from "lucide-react"
import { useRef, useState } from "react"
import { toast } from "sonner"

import { EmptyState, QueryBoundary } from "@/components/shared/query-boundary"
import { StatusPill } from "@/components/shared/status-pill"
import { tableCell, tableHead } from "@/components/shared/table-styles"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ACCEPTED_FILES, DOCUMENT_TYPES, MAX_FILE_BYTES } from "@/features/referrals/assessment"
import { ApiError } from "@/lib/api/client"
import { formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"

import { useDocuments, useUploadDocument } from "../api"
import { RECORD_STATUS } from "./record-status"

type DocumentType = (typeof DOCUMENT_TYPES)[number]

export function DocumentsTab({ residentId, locked }: { residentId: string; locked: boolean }) {
  const query = useDocuments(residentId)
  const [upload, setUpload] = useState<{ type: DocumentType } | null>(null)

  return (
    <QueryBoundary query={query} fallback={<Skeleton className="h-64 rounded-card" />}>
      {(documents) => (
        <div className="space-y-4">
          <section className="flex flex-wrap items-center justify-between gap-4 rounded-card surface p-5">
            <div>
              <h3 className="text-sm font-semibold text-heading">
                Documents shared with the Council
              </h3>
              <p className="text-[13px] text-muted-foreground">
                Care plans, assessments and consent forms. Uploading the same type adds a new
                version; the Council verifies each one.
              </p>
            </div>
            {!locked && (
              <Button
                className="h-10 px-4"
                onClick={() => setUpload({ type: "Care or support plan" })}
              >
                <Upload aria-hidden />
                Upload document
              </Button>
            )}
          </section>

          <section className="overflow-hidden rounded-card surface">
            {documents.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No documents yet"
                description="Upload the current care or support plan first."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className={tableHead}>Document</TableHead>
                    <TableHead className={tableHead}>Version</TableHead>
                    <TableHead className={tableHead}>Uploaded</TableHead>
                    <TableHead className={tableHead}>Status</TableHead>
                    <TableHead className={cn(tableHead, "w-12")}>
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className={tableCell}>
                        <span className="flex items-center gap-2.5">
                          <FileText className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                          <span className="min-w-0">
                            <span className="block truncate font-medium text-heading">
                              {d.name}
                            </span>
                            <span className="block text-xs text-muted-foreground">
                              {d.type} · {(d.size / 1024).toFixed(0)} KB
                            </span>
                          </span>
                        </span>
                      </TableCell>
                      <TableCell className={cn(tableCell, "tabular-nums")}>v{d.version}</TableCell>
                      <TableCell className={tableCell}>
                        <span className="block tabular-nums">{formatDate(d.uploadedAt)}</span>
                        <span className="block text-xs text-muted-foreground">{d.uploadedBy}</span>
                      </TableCell>
                      <TableCell className={tableCell}>
                        <StatusPill tone={RECORD_STATUS[d.status].tone} caps>
                          {RECORD_STATUS[d.status].label}
                        </StatusPill>
                      </TableCell>
                      <TableCell className={tableCell}>
                        {!locked && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label={`Actions for ${d.name}`}
                              >
                                <MoreHorizontal aria-hidden />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onSelect={() => setUpload({ type: d.type })}>
                                Upload new version
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </section>

          <UploadDialog
            residentId={residentId}
            initialType={upload?.type ?? null}
            onClose={() => setUpload(null)}
          />
        </div>
      )}
    </QueryBoundary>
  )
}

function UploadDialog({
  residentId,
  initialType,
  onClose,
}: {
  residentId: string
  initialType: DocumentType | null
  onClose: () => void
}) {
  const mutation = useUploadDocument(residentId)
  const [type, setType] = useState<DocumentType | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const input = useRef<HTMLInputElement>(null)
  const chosenType = type ?? initialType ?? "Care or support plan"

  const close = () => {
    setType(null)
    setFile(null)
    onClose()
  }

  const submit = async () => {
    if (!file) return
    try {
      const created = await mutation.mutateAsync({
        name: file.name,
        size: file.size,
        type: chosenType,
      })
      toast.success("Document sent to the Council", {
        description: `${created.name} (v${created.version}) is waiting for the Council to verify it.`,
      })
      close()
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not upload the document")
    }
  }

  return (
    <Dialog open={initialType !== null} onOpenChange={(open) => !open && close()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-heading">Upload document</DialogTitle>
          <DialogDescription>
            PDF, Word, JPG or PNG, up to 10 MB. Only the Council sees it; volunteers never do.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-heading">Document type</span>
            <Select value={chosenType} onValueChange={(v) => setType(v as DocumentType)}>
              <SelectTrigger className="h-10 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
          <input
            ref={input}
            type="file"
            accept={ACCEPTED_FILES}
            className="sr-only"
            aria-label="Choose a file"
            onChange={(e) => {
              const picked = e.target.files?.[0] ?? null
              if (picked && picked.size > MAX_FILE_BYTES) {
                toast.error(`${picked.name} is larger than 10 MB`)
                return
              }
              setFile(picked)
            }}
          />
          <Button
            variant="outline"
            className="h-10 w-full justify-start"
            onClick={() => input.current?.click()}
          >
            <Paperclip aria-hidden />
            {file ? file.name : "Choose a file"}
          </Button>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={close}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!file || mutation.isPending}>
            {mutation.isPending && <Spinner />}
            Send to Council
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
