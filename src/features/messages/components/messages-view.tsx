"use client"

import {
  ArrowRight,
  ChevronLeft,
  Check,
  CheckCheck,
  Info,
  Lock,
  MessageSquare,
  Search,
  SendHorizontal,
} from "lucide-react"
import Link from "next/link"
import { parseAsString, parseAsStringLiteral, useQueryState } from "nuqs"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"

import { EmptyState, QueryBoundary } from "@/components/shared/query-boundary"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { residentHref } from "@/features/clients/components/client-link"
import { useCan, useSession } from "@/features/session/api"
import { formatDate, formatDayMonth, formatTime, initials, isToday } from "@/lib/format"
import { cn } from "@/lib/utils"

import { useMarkThreadRead, useSendMessage, useThreads } from "../api"
import { type Message, type Thread } from "../schemas"

const FILTERS = ["all", "unread"] as const

const QUICK_REPLIES = [
  "Noted, thank you",
  "Please arrange a welfare check",
  "Could you update the volunteer?",
  "Can you call me today?",
]

const ukDay = (iso: string) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London" }).format(new Date(iso))

function stamp(iso: string) {
  return isToday(ukDay(iso)) ? formatTime(iso) : formatDayMonth(iso)
}

function dayLabel(iso: string) {
  const day = ukDay(iso)
  if (isToday(day)) return "Today"
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  if (day === ukDay(yesterday.toISOString())) return "Yesterday"
  return formatDate(day)
}

/** Messages, laid out as the Council Dashboard / corporate chat screens. */
export function MessagesView() {
  const query = useThreads()
  const [selected, setSelected] = useQueryState("thread", parseAsString)
  const [filter, setFilter] = useQueryState(
    "show",
    parseAsStringLiteral(FILTERS).withDefault("all"),
  )
  const [search, setSearch] = useState("")

  return (
    <QueryBoundary
      query={query}
      fallback={<Skeleton className="h-[calc(100svh-10rem)] rounded-panel" />}
    >
      {(threads) => {
        const term = search.trim().toLowerCase()
        const visible = threads.filter(
          (t) =>
            (filter === "all" || t.unread > 0) &&
            (!term ||
              t.subject.toLowerCase().includes(term) ||
              t.clientRef?.toLowerCase().includes(term)),
        )
        const active = threads.find((t) => t.id === selected) ?? visible[0] ?? threads[0]
        return (
          // Phones and tablets show the list or the open conversation (master/detail);
          // from md the list sits beside the chat; from xl the details panel joins them.
          <div className="grid h-[calc(100svh-8.5rem)] min-h-[30rem] grid-cols-1 overflow-hidden rounded-panel surface md:h-[calc(100svh-10rem)] md:grid-cols-[300px_minmax(0,1fr)] lg:grid-cols-[340px_minmax(0,1fr)] xl:grid-cols-[340px_minmax(0,1fr)_300px]">
            <aside
              className={cn(
                "min-h-0 min-w-0 flex-col border-r",
                selected ? "hidden md:flex" : "flex",
              )}
              aria-label="Conversations"
            >
              <div className="space-y-4 px-[18px] pt-5 pb-4">
                <h1 className="text-xl font-semibold text-chat-ink">Messages</h1>
                <label className="flex h-10 items-center gap-2.5 rounded-[9px] border border-chat-line px-3 text-[15px]">
                  <Search className="size-4 text-chat-subtle" aria-hidden />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search conversations..."
                    aria-label="Search conversations"
                    className="w-full bg-transparent text-chat-ink outline-none placeholder:text-chat-subtle"
                  />
                </label>
                <div role="tablist" aria-label="Filter conversations" className="flex gap-1">
                  {FILTERS.map((f) => (
                    <button
                      key={f}
                      type="button"
                      role="tab"
                      aria-selected={filter === f}
                      onClick={() => setFilter(f === "all" ? null : f)}
                      className={cn(
                        "h-8 rounded-full px-3.5 text-[13.5px] font-medium",
                        filter === f
                          ? "bg-chat-ink text-white"
                          : "bg-chat-soft text-chat-muted hover:text-chat-ink",
                      )}
                    >
                      {f === "all" ? "All" : "Unread"}
                    </button>
                  ))}
                </div>
              </div>
              <ul className="min-h-0 flex-1 overflow-y-auto border-t">
                {visible.length === 0 ? (
                  <li className="px-5 py-10 text-center text-sm text-chat-muted">
                    No conversations
                  </li>
                ) : (
                  visible.map((t) => (
                    <ThreadRow
                      key={t.id}
                      thread={t}
                      active={t.id === active?.id}
                      onSelect={() => setSelected(t.id)}
                    />
                  ))
                )}
              </ul>
            </aside>

            {active ? (
              <>
                <Conversation
                  key={active.id}
                  thread={active}
                  className={selected ? "flex" : "hidden md:flex"}
                  onBack={() => setSelected(null)}
                />
                <ThreadDetails thread={active} />
              </>
            ) : (
              <EmptyState icon={MessageSquare} title="No conversations yet" />
            )}
          </div>
        )
      }}
    </QueryBoundary>
  )
}

function CoordinatorAvatar({
  size = "md",
  online = false,
}: {
  size?: "sm" | "md" | "lg"
  online?: boolean
}) {
  return (
    <span
      className={cn(
        "relative flex shrink-0 items-center justify-center rounded-full bg-primary font-bold text-white",
        size === "sm" && "size-9 text-[11px]",
        size === "md" && "size-[45px] text-[15px]",
        size === "lg" && "size-[72px] text-2xl",
      )}
      aria-hidden
    >
      VC
      {online && (
        <span className="absolute right-0 bottom-0 size-[13px] rounded-full border-2 border-white bg-chat-online" />
      )}
    </span>
  )
}

function ThreadRow({
  thread: t,
  active,
  onSelect,
}: {
  thread: Thread
  active: boolean
  onSelect: () => void
}) {
  const last = t.messages[t.messages.length - 1]
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        aria-current={active ? "true" : undefined}
        className={cn(
          "flex w-full gap-3.5 border-b px-[18px] py-4 text-left",
          active ? "border-r-2 border-r-chat-sent bg-chat-active" : "hover:bg-chat-soft/60",
        )}
      >
        <CoordinatorAvatar online />
        <span className="min-w-0 flex-1 space-y-1">
          <span className="flex items-baseline justify-between gap-2">
            <span className="truncate text-base font-semibold text-chat-ink">{t.participant}</span>
            {last && (
              <span className="shrink-0 text-xs text-chat-subtle">{stamp(last.sentAt)}</span>
            )}
          </span>
          <span className="flex items-center justify-between gap-2">
            <span className="truncate text-sm text-chat-muted">{last?.body ?? t.subject}</span>
            {t.unread > 0 && (
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-chat-sent text-[11px] font-semibold text-white">
                {t.unread}
              </span>
            )}
          </span>
          <span className="flex flex-wrap gap-1.5 pt-0.5">
            <span className="rounded-full bg-chat-tag px-2 py-0.5 text-[11px] font-medium text-chat-tag-foreground">
              Coordinator
            </span>
            {t.clientRef && (
              <span className="rounded-full bg-info-soft px-2 py-0.5 text-[11px] font-medium text-info-foreground tabular-nums">
                {t.clientRef}
              </span>
            )}
          </span>
        </span>
      </button>
    </li>
  )
}

function Conversation({
  thread,
  className,
  onBack,
}: {
  thread: Thread
  className?: string
  /** Back to the conversation list on small screens. */
  onBack: () => void
}) {
  const [draft, setDraft] = useState("")
  const send = useSendMessage(thread.id)
  const canSend = useCan("messages.send")
  const { data: session } = useSession()
  const { mutate: markThreadRead } = useMarkThreadRead()
  const scrollRef = useRef<HTMLDivElement>(null)
  const me = session ? initials(session.user.displayName) : "You"

  useEffect(() => {
    if (thread.unread > 0) markThreadRead(thread.id)
  }, [thread.id, thread.unread, markThreadRead])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [thread.messages.length])

  const submit = (text = draft) => {
    const body = text.trim()
    if (!body) return
    setDraft("")
    send.mutate(body, { onError: () => toast.error("Message not sent. Try again.") })
  }

  // Group messages under a date separator per UK day.
  const groups: { label: string; messages: Message[] }[] = []
  for (const m of thread.messages) {
    const label = dayLabel(m.sentAt)
    const group = groups.at(-1)
    if (group?.label === label) group.messages.push(m)
    else groups.push({ label, messages: [m] })
  }

  return (
    <section className={cn("min-h-0 min-w-0 flex-col", className)} aria-label={thread.subject}>
      <header className="flex items-center gap-3 border-b px-4 py-3.5 sm:gap-3.5 sm:px-6 sm:py-4">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to conversations"
          className="-ml-1 flex size-9 shrink-0 items-center justify-center rounded-lg text-chat-muted hover:bg-chat-soft md:hidden"
        >
          <ChevronLeft className="size-5" aria-hidden />
        </button>
        <CoordinatorAvatar online />
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-lg font-semibold text-chat-ink">{thread.participant}</h2>
          <p className="flex min-w-0 items-center gap-1.5 text-[13px] text-chat-muted">
            <span className="size-2 shrink-0 rounded-full bg-chat-online" aria-hidden />
            <span className="truncate">Online · {thread.subject}</span>
          </p>
        </div>
        <span className="hidden items-center gap-1.5 rounded-full border border-chat-line px-3 py-1 text-xs text-chat-muted sm:flex">
          <Lock className="size-3" aria-hidden />
          Audited
        </span>
      </header>

      {thread.clientRef && (
        <div className="flex items-center gap-2 border-b border-chat-context-line bg-chat-active px-4 py-3 text-[13px] sm:px-6">
          <span className="font-semibold tracking-wide text-chat-sent uppercase">Resident:</span>
          <span className="font-medium text-chat-sent tabular-nums">{thread.clientRef}</span>
          <Link
            href={residentHref(thread.clientRef)}
            className="ml-1 inline-flex items-center gap-1 text-chat-sent underline-offset-2 hover:underline"
          >
            View profile
            <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        </div>
      )}

      <div
        ref={scrollRef}
        // Focusable so keyboard users can scroll the conversation.
        tabIndex={0}
        aria-label="Conversation history"
        className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-5 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-inset sm:px-6 sm:py-6"
      >
        {groups.map((group) => (
          <div key={group.label} className="space-y-5">
            <div className="flex items-center gap-3.5" role="separator" aria-label={group.label}>
              <span className="h-px flex-1 bg-chat-soft" />
              <span className="text-xs font-medium tracking-[0.08em] text-chat-subtle uppercase">
                {group.label}
              </span>
              <span className="h-px flex-1 bg-chat-soft" />
            </div>
            {group.messages.map((m) =>
              m.from === "PROVIDER" ? (
                <Sent key={m.id} message={m} initials={me} />
              ) : (
                <Received key={m.id} message={m} />
              ),
            )}
          </div>
        ))}
      </div>

      {!canSend ? (
        <p className="border-t px-6 py-4 text-xs text-chat-muted">
          Your role can read these conversations but not reply.
        </p>
      ) : (
        <div className="border-t">
          <div className="flex gap-2 overflow-x-auto px-4 pt-4 sm:px-6">
            {QUICK_REPLIES.map((reply) => (
              <button
                key={reply}
                type="button"
                onClick={() => setDraft(reply)}
                className="shrink-0 rounded-full border border-chat-line px-3.5 py-1.5 text-sm text-chat-ink hover:bg-chat-soft"
              >
                {reply === QUICK_REPLIES[0] && (
                  <Check className="mr-1 inline size-3.5" aria-hidden />
                )}
                {reply}
              </button>
            ))}
          </div>
          <form
            className="m-3 rounded-[18px] border border-chat-line sm:m-4 sm:mx-6"
            onSubmit={(e) => {
              e.preventDefault()
              submit()
            }}
          >
            <div className="flex items-end gap-3 px-4 py-3">
              <Textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    submit()
                  }
                }}
                rows={1}
                placeholder={`Message ${thread.participant}...`}
                aria-label="Message"
                className="max-h-32 min-h-10 resize-none border-0 px-0 text-[15px] shadow-none focus-visible:ring-0"
              />
              <button
                type="submit"
                disabled={!draft.trim()}
                aria-label="Send"
                className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-chat-sent text-white disabled:opacity-50"
              >
                <SendHorizontal className="size-[18px]" aria-hidden />
              </button>
            </div>
            <p className="flex justify-between gap-4 border-t px-4 py-2 text-xs text-chat-subtle">
              <span className="flex items-center gap-1.5">
                <Lock className="size-3" aria-hidden />
                All messages are audited
              </span>
              <span className="hidden sm:inline">
                Press Enter to send · Shift+Enter for new line
              </span>
            </p>
          </form>
        </div>
      )}
    </section>
  )
}

function Received({ message: m }: { message: Message }) {
  return (
    <div className="flex items-start gap-3.5">
      <CoordinatorAvatar size="sm" />
      <div className="max-w-[min(491px,75%)] space-y-1">
        <p className="text-xs font-semibold text-chat-muted">{m.author}</p>
        <p className="rounded-[18px] rounded-tl-[6px] bg-chat-soft px-[18px] py-2.5 text-[15px] leading-relaxed text-chat-ink">
          {m.body}
        </p>
        <p className="text-xs text-chat-subtle">{formatTime(m.sentAt)}</p>
      </div>
    </div>
  )
}

function Sent({ message: m, initials: me }: { message: Message; initials: string }) {
  const pending = m.id.startsWith("optimistic-")
  return (
    <div className="flex flex-row-reverse items-start gap-3.5">
      <span
        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-chat-sent text-[11px] font-bold text-white"
        aria-hidden
      >
        {me}
      </span>
      <div className="flex max-w-[min(491px,75%)] flex-col items-end space-y-1">
        <p className="rounded-[18px] rounded-tr-[6px] bg-chat-sent px-[18px] py-2.5 text-[15px] leading-relaxed text-white">
          {m.body}
        </p>
        <p className="flex items-center gap-1 text-xs text-chat-subtle">
          {formatTime(m.sentAt)} · {pending ? "Sending" : "Delivered"}
          {!pending && <CheckCheck className="size-3.5" aria-hidden />}
        </p>
      </div>
    </div>
  )
}

function ThreadDetails({ thread }: { thread: Thread }) {
  const fromCoordinator = thread.messages.filter((m) => m.from === "COORDINATOR")
  const coordinatorRef = fromCoordinator[0]?.author
  const lastReply = fromCoordinator.at(-1)
  return (
    <aside
      className="hidden min-h-0 overflow-y-auto border-l xl:block"
      aria-label="Conversation details"
    >
      <div className="flex flex-col items-center gap-2 border-b px-5 py-7 text-center">
        <CoordinatorAvatar size="lg" />
        <p className="pt-2 text-lg font-semibold text-chat-ink">{thread.participant}</p>
        {coordinatorRef && <p className="text-sm text-chat-muted tabular-nums">{coordinatorRef}</p>}
        <span className="rounded-full bg-chat-tag px-2.5 py-0.5 text-xs font-medium text-chat-tag-foreground">
          Coordinator
        </span>
      </div>
      <dl className="grid grid-cols-2 gap-2 border-b p-4">
        <div className="rounded-xl bg-chat-soft/60 px-3 py-4 text-center">
          <dd className="text-xl font-bold text-chat-ink tabular-nums">{thread.messages.length}</dd>
          <dt className="mt-1 text-[11px] font-semibold tracking-wide text-chat-subtle uppercase">
            Messages
          </dt>
        </div>
        <div className="rounded-xl bg-chat-soft/60 px-3 py-4 text-center">
          <dd className="text-xl font-bold text-chat-ink tabular-nums">
            {lastReply ? stamp(lastReply.sentAt) : "—"}
          </dd>
          <dt className="mt-1 text-[11px] font-semibold tracking-wide text-chat-subtle uppercase">
            Last reply
          </dt>
        </div>
      </dl>
      {thread.clientRef && (
        <div className="space-y-3 border-b p-5">
          <p className="text-[11px] font-semibold tracking-[0.08em] text-chat-subtle uppercase">
            Related resident
          </p>
          <Link
            href={residentHref(thread.clientRef)}
            className="block rounded-xl border border-chat-context-line bg-chat-active px-4 py-3 hover:border-chat-sent/40"
          >
            <span className="block font-semibold text-chat-ink tabular-nums">
              {thread.clientRef}
            </span>
            <span className="block text-sm text-chat-muted">Open resident profile</span>
          </Link>
        </div>
      )}
      <div className="space-y-2 p-5">
        <p className="text-[11px] font-semibold tracking-[0.08em] text-chat-subtle uppercase">
          About
        </p>
        <p className="flex gap-2 text-sm leading-relaxed text-chat-muted">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
          Messages are audited and kept on the record. Use Buddii IDs, never names or clinical
          details.
        </p>
      </div>
    </aside>
  )
}
