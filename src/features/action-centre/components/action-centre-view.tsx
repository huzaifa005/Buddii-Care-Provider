"use client"

import { isBefore, parseISO } from "date-fns"
import { ArrowRight, ClipboardCheck, Paperclip, RotateCcw, Search, X } from "lucide-react"
import Link from "next/link"
import { parseAsString, parseAsStringLiteral, useQueryState } from "nuqs"
import { useRef, useState } from "react"
import { toast } from "sonner"

import { PageHeader } from "@/components/shared/page-header"
import { Panel } from "@/components/shared/panel"
import { EmptyState, QueryBoundary } from "@/components/shared/query-boundary"
import { StatCard, StatCardSkeleton } from "@/components/shared/stat-card"
import { StatusDot } from "@/components/shared/status-dot"
import { StatusPill, type StatusTone } from "@/components/shared/status-pill"
import { tableCell, tableHead } from "@/components/shared/table-styles"
import { Button } from "@/components/ui/button"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
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
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
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
import { Textarea } from "@/components/ui/textarea"
import { ACCEPTED_FILES, MAX_FILE_BYTES } from "@/features/referrals/assessment"
import { ResidentLink } from "@/features/residents/components/resident-link"
import { ApiError } from "@/lib/api/client"
import { formatDate, formatTime } from "@/lib/format"
import { KpiIcons } from "@/lib/icons"
import { cn } from "@/lib/utils"

import { useActions, useReplyToAction } from "../api"
import { type Action, type ActionKind, type ActionPriority } from "../schemas"

const PRIORITY: Record<ActionPriority, { label: string; tone: StatusTone }> = {
  HIGH: { label: "High", tone: "danger" },
  MEDIUM: { label: "Medium", tone: "warning" },
  LOW: { label: "Low", tone: "neutral" },
}

const KIND: Record<ActionKind, { label: string; tone: StatusTone }> = {
  INFO_REQUEST: { label: "Council request", tone: "info" },
  ASSIGNMENT: { label: "Assignment", tone: "neutral" },
  REVIEW_DUE: { label: "Review", tone: "warning" },
  OBSERVATION: { label: "Volunteer", tone: "success" },
}

const PRIORITY_FILTERS = ["all", "HIGH", "MEDIUM", "LOW"] as const
const SOURCE_FILTERS = ["all", "INFO_REQUEST", "ASSIGNMENT", "REVIEW_DUE", "OBSERVATION"] as const
const STATUS_FILTERS = ["open", "replied", "all"] as const
const STATUS_LABEL = { open: "Open", replied: "Replied", all: "All" } as const

/** Where the work is finished when it is not a Council request. */
const OPEN_LABEL: Record<ActionKind, string> = {
  INFO_REQUEST: "Open related record",
  ASSIGNMENT: "Confirm or decline",
  REVIEW_DUE: "Start the review",
  OBSERVATION: "Respond to the observation",
}

/** Action Centre, following the Council Dashboard Action Centre (05): one list, every source. */
export function ActionCentreView() {
  const query = useActions()
  return (
    <div className="space-y-6">
      <PageHeader
        title="Action Centre"
        description="Everything that needs you: Council requests, new assignments, review dates and volunteer observations"
      />
      <QueryBoundary
        query={query}
        fallback={
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              {Array.from({ length: 4 }, (_, i) => (
                <StatCardSkeleton key={i} />
              ))}
            </div>
            <Skeleton className="h-96 rounded-panel" />
          </div>
        }
      >
        {(actions) => <ActionCentreContent actions={actions} />}
      </QueryBoundary>
    </div>
  )
}

function ActionCentreContent({ actions }: { actions: Action[] }) {
  const [priority, setPriority] = useQueryState(
    "priority",
    parseAsStringLiteral(PRIORITY_FILTERS).withDefault("all"),
  )
  const [source, setSource] = useQueryState(
    "source",
    parseAsStringLiteral(SOURCE_FILTERS).withDefault("all"),
  )
  const [status, setStatus] = useQueryState(
    "status",
    parseAsStringLiteral(STATUS_FILTERS).withDefault("open"),
  )
  const [search, setSearch] = useQueryState("q", parseAsString.withDefault(""))
  const [openId, setOpenId] = useQueryState("action", parseAsString)
  const today = new Date()

  const open = actions.filter((a) => a.status === "OPEN")
  const isOverdue = (a: Action) => a.dueAt !== null && isBefore(parseISO(a.dueAt), today)
  const term = search.trim().toLowerCase()
  const rows = actions.filter(
    (a) =>
      (status === "all" || a.status === (status === "open" ? "OPEN" : "REPLIED")) &&
      (priority === "all" || a.priority === priority) &&
      (source === "all" || a.kind === source) &&
      (!term ||
        [a.title, a.residentName, a.sourceRef, a.detail].some((t) =>
          t.toLowerCase().includes(term),
        )),
  )
  const filtered = priority !== "all" || source !== "all" || status !== "open" || term !== ""
  const selected = actions.find((a) => a.id === openId) ?? null

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          featured
          label="Open actions"
          value={open.length}
          icon={KpiIcons.review}
          caption="waiting for you"
          href="/action-centre"
        />
        <StatCard
          label="High priority"
          value={open.filter((a) => a.priority === "HIGH").length}
          icon={KpiIcons.attention}
          attention={open.some((a) => a.priority === "HIGH") ? "Action required" : undefined}
          caption="Council requests and overdue reviews"
          href="/action-centre?priority=HIGH"
        />
        <StatCard
          label="Council requests"
          value={open.filter((a) => a.kind === "INFO_REQUEST").length}
          icon={KpiIcons.bell}
          caption="reply and upload here"
          href="/action-centre?source=INFO_REQUEST"
        />
        <StatCard
          label="Reviews due"
          value={open.filter((a) => a.kind === "REVIEW_DUE").length}
          icon={KpiIcons.wellbeing}
          caption={`${open.filter(isOverdue).length} overdue`}
          href="/action-centre?source=REVIEW_DUE"
        />
      </div>

      <Panel className="overflow-hidden p-0">
        <div className="flex flex-col gap-3 border-b px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            <FilterSelect
              label="Priority"
              value={priority}
              onChange={(v) => void setPriority(v === "all" ? null : v)}
              options={PRIORITY_FILTERS.map((p) => [p, p === "all" ? "All" : PRIORITY[p].label])}
            />
            <FilterSelect
              label="Source"
              value={source}
              onChange={(v) => void setSource(v === "all" ? null : v)}
              options={SOURCE_FILTERS.map((s) => [s, s === "all" ? "All" : KIND[s].label])}
            />
            <FilterSelect
              label="Status"
              value={status}
              onChange={(v) => void setStatus(v === "open" ? null : v)}
              options={STATUS_FILTERS.map((s) => [s, STATUS_LABEL[s]])}
            />
            {filtered && (
              <Button
                variant="ghost"
                className="h-10 px-3"
                onClick={() => {
                  void setPriority(null)
                  void setSource(null)
                  void setStatus(null)
                  void setSearch(null)
                }}
              >
                <RotateCcw aria-hidden />
                Reset
              </Button>
            )}
          </div>
          <InputGroup className="h-10 lg:w-80">
            <InputGroupAddon>
              <Search aria-hidden />
            </InputGroupAddon>
            <InputGroupInput
              value={search}
              onChange={(e) => void setSearch(e.target.value || null)}
              placeholder="Search by action, resident or reference"
              aria-label="Search actions"
            />
          </InputGroup>
        </div>

        {rows.length === 0 ? (
          <EmptyState
            icon={ClipboardCheck}
            title={filtered ? "No actions match" : "Nothing needs you right now"}
            description={filtered ? "Try a different filter or search term." : undefined}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className={tableHead}>Priority</TableHead>
                <TableHead className={tableHead}>Action</TableHead>
                <TableHead className={tableHead}>Related to</TableHead>
                <TableHead className={tableHead}>Source</TableHead>
                <TableHead className={tableHead}>Raised</TableHead>
                <TableHead className={tableHead}>Due</TableHead>
                <TableHead className={tableHead}>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((a) => (
                <TableRow
                  key={a.id}
                  className="cursor-pointer"
                  onClick={(e) => {
                    if ((e.target as HTMLElement).closest("a")) return
                    void setOpenId(a.id)
                  }}
                >
                  <TableCell className={tableCell}>
                    <StatusDot tone={PRIORITY[a.priority].tone}>
                      {PRIORITY[a.priority].label}
                    </StatusDot>
                  </TableCell>
                  <TableCell className={cn(tableCell, "max-w-md")}>
                    <button
                      type="button"
                      className="block truncate text-left font-semibold text-heading hover:underline"
                    >
                      {a.title}
                    </button>
                    <span className="block text-xs text-muted-foreground tabular-nums">
                      {a.sourceRef}
                    </span>
                  </TableCell>
                  <TableCell className={cn(tableCell, "whitespace-nowrap")}>
                    {a.residentId ? (
                      <ResidentLink
                        residentId={a.residentId}
                        className="font-medium text-heading hover:underline"
                      >
                        {a.residentName}
                      </ResidentLink>
                    ) : (
                      <span className="font-medium text-heading">{a.residentName}</span>
                    )}
                  </TableCell>
                  <TableCell className={tableCell}>
                    <StatusPill tone={KIND[a.kind].tone}>{KIND[a.kind].label}</StatusPill>
                  </TableCell>
                  <TableCell className={cn(tableCell, "tabular-nums")}>
                    {formatDate(a.raisedAt)}
                  </TableCell>
                  <TableCell className={cn(tableCell, "tabular-nums")}>
                    {a.dueAt ? (
                      <span
                        className={cn(isOverdue(a) && "font-semibold text-destructive-foreground")}
                      >
                        {formatDate(a.dueAt)}
                        {isOverdue(a) && " · overdue"}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className={tableCell}>
                    <StatusPill tone={a.status === "OPEN" ? "warning" : "success"} caps>
                      {a.status === "OPEN" ? "Open" : "Replied"}
                    </StatusPill>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <p className="border-t px-6 py-3 text-xs text-muted-foreground">
          Showing {rows.length} of {actions.length} actions. Assignments, reviews and observations
          are completed from their source record.
        </p>
      </Panel>

      <ActionSheet action={selected} onClose={() => void setOpenId(null)} />
    </>
  )
}

function FilterSelect<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: T
  onChange: (value: T) => void
  options: (readonly [T, string])[]
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as T)}>
      <SelectTrigger
        className="w-full min-w-0 sm:w-auto sm:min-w-36"
        aria-label={`Filter by ${label.toLowerCase()}`}
      >
        <span className="text-muted-foreground">{label}:</span>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map(([v, text]) => (
          <SelectItem key={v} value={v}>
            {text}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function ActionSheet({ action, onClose }: { action: Action | null; onClose: () => void }) {
  return (
    <Sheet open={action !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-[520px]">
        {action && (
          <>
            <SheetHeader className="border-b px-6 py-5">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <StatusDot tone={PRIORITY[action.priority].tone}>
                  {PRIORITY[action.priority].label} priority
                </StatusDot>
                <StatusPill tone={KIND[action.kind].tone}>{KIND[action.kind].label}</StatusPill>
              </div>
              <SheetTitle className="text-xl font-bold text-heading">{action.title}</SheetTitle>
              <SheetDescription>
                {action.residentName} · {action.sourceRef} · raised {formatDate(action.raisedAt)} by{" "}
                {action.raisedBy}
              </SheetDescription>
            </SheetHeader>
            <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
              <p className="rounded-lg bg-muted px-4 py-3 text-[13px] leading-relaxed text-foreground">
                {action.detail}
              </p>
              {action.dueAt && (
                <p className="text-[13px] text-muted-foreground">
                  Due <span className="font-semibold text-heading">{formatDate(action.dueAt)}</span>
                </p>
              )}
              <Button asChild variant="outline" className="h-10 w-full justify-between">
                <Link href={action.href}>
                  {OPEN_LABEL[action.kind]}
                  <ArrowRight aria-hidden />
                </Link>
              </Button>
              {action.reply ? (
                <SentReply reply={action.reply} />
              ) : action.canReply ? (
                <ReplyForm action={action} />
              ) : (
                <p className="text-xs text-muted-foreground">
                  This action closes when it is completed in its source record.
                </p>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

function SentReply({ reply }: { reply: NonNullable<Action["reply"]> }) {
  return (
    <section className="rounded-lg border p-4">
      <p className="text-xs font-semibold text-muted-foreground uppercase">Your reply</p>
      <p className="mt-2 text-[13px] whitespace-pre-line text-foreground">{reply.message}</p>
      {reply.files.length > 0 && (
        <ul className="mt-3 space-y-1">
          {reply.files.map((f) => (
            <li key={f.name} className="flex items-center gap-2 text-xs text-muted-foreground">
              <Paperclip className="size-3.5" aria-hidden />
              {f.name} · {f.type}
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-xs text-muted-foreground">
        Sent {formatDate(reply.at)} {formatTime(reply.at)} by {reply.by}. The Council will verify
        any files.
      </p>
    </section>
  )
}

function ReplyForm({ action }: { action: Action }) {
  const mutation = useReplyToAction()
  const [message, setMessage] = useState("")
  const [files, setFiles] = useState<File[]>([])
  const input = useRef<HTMLInputElement>(null)
  const type = action.title.includes("care") ? "Care or support plan" : "Other"

  const add = (list: FileList | null) => {
    const picked = [...(list ?? [])]
    const tooBig = picked.filter((f) => f.size > MAX_FILE_BYTES)
    if (tooBig.length) toast.error(`${tooBig.map((f) => f.name).join(", ")} is larger than 10 MB`)
    setFiles((current) => [...current, ...picked.filter((f) => f.size <= MAX_FILE_BYTES)])
  }

  const send = async () => {
    try {
      await mutation.mutateAsync({
        id: action.id,
        input: {
          message,
          files: files.map((f) => ({ name: f.name, size: f.size, type })),
        },
      })
      toast.success("Reply sent to the Council", {
        description: files.length
          ? `${files.length} ${files.length === 1 ? "file" : "files"} added to the resident's documents.`
          : undefined,
      })
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not send the reply")
    }
  }

  return (
    <section className="space-y-3">
      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-heading">Reply to the Council</span>
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          placeholder="What you checked or changed, and anything still missing"
        />
      </label>
      <input
        ref={input}
        type="file"
        multiple
        accept={ACCEPTED_FILES}
        className="sr-only"
        aria-label="Attach files"
        onChange={(e) => {
          add(e.target.files)
          e.target.value = ""
        }}
      />
      {files.length > 0 && (
        <ul className="space-y-1.5">
          {files.map((f, i) => (
            <li
              key={`${f.name}-${i}`}
              className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-[13px]"
            >
              <span className="flex min-w-0 items-center gap-2">
                <Paperclip className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                <span className="truncate">{f.name}</span>
              </span>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Remove ${f.name}`}
                onClick={() => setFiles((c) => c.filter((_, j) => j !== i))}
              >
                <X aria-hidden />
              </Button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap justify-between gap-2">
        <Button variant="outline" className="h-10" onClick={() => input.current?.click()}>
          <Paperclip aria-hidden />
          Attach files
        </Button>
        <Button
          className="h-10"
          onClick={send}
          disabled={message.trim() === "" || mutation.isPending}
        >
          {mutation.isPending && <Spinner />}
          Send reply
        </Button>
      </div>
    </section>
  )
}
