"use client"

import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Circle,
  FileText,
  Info,
  Lock,
  Paperclip,
  Send,
  Trash2,
  XCircle,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { useSubmitAssessment } from "@/features/resident-records/api"
import {
  ASSESSMENT_KIND_LABEL,
  type AssessmentKind,
  KIND_SECTIONS,
} from "@/features/resident-records/schemas"
import { useResidentName } from "@/features/residents/api"
import { residentHref } from "@/features/residents/components/resident-link"
import { useSession } from "@/features/session/api"
import { ApiError } from "@/lib/api/client"
import { formatTime } from "@/lib/format"
import { cn } from "@/lib/utils"

import { useSubmitReferral } from "../api"
import {
  ACCEPTED_FILES,
  type Answers,
  type AssessmentSection,
  DOCUMENT_TYPES,
  evaluateRules,
  type GateResult,
  MAX_FILE_BYTES,
  notKnownCount,
  type Person,
  personSchema,
  type Question,
  REQUIRED,
  SECTIONS,
} from "../assessment"

type DocumentType = (typeof DOCUMENT_TYPES)[number]
interface Attachment {
  id: string
  file: File
  type: DocumentType
}

const EMPTY_PERSON: Partial<Person> = {}

const PERSON_FIELDS: {
  id: keyof Person
  label: string
  placeholder?: string
  type?: string
  optional?: boolean
}[] = [
  { id: "fullName", label: "Full name" },
  { id: "preferredName", label: "Preferred name", optional: true },
  { id: "dateOfBirth", label: "Date of birth", type: "date" },
  { id: "telephone", label: "Telephone", placeholder: "+44 20 8461 7000" },
  { id: "address", label: "Address" },
  { id: "postcode", label: "Postcode", placeholder: "BR1 3AA" },
  { id: "preferredLanguage", label: "Preferred language", optional: true },
  {
    id: "emergencyContact",
    label: "Emergency contact (name, relationship, phone)",
    optional: true,
  },
  { id: "gpSurgery", label: "GP surgery", optional: true },
]

export type FormMode =
  { type: "referral" } | { type: "assessment"; residentId: string; kind: AssessmentKind }

/** Provider sends a resident to the Council with the Buddii Wellbeing Assessment (v0.2). */
export function ReferResidentForm() {
  return <WellbeingAssessmentForm mode={{ type: "referral" }} />
}

/**
 * Buddii Wellbeing Assessment (v0.2). Referral mode also collects Section B (identity) for a
 * new resident; assessment mode records a baseline or review for an existing resident.
 */
export function WellbeingAssessmentForm({ mode }: { mode: FormMode }) {
  const router = useRouter()
  const { data: session } = useSession()
  const referral = useSubmitReferral()
  const assessment = useSubmitAssessment(mode.type === "assessment" ? mode.residentId : "")
  const submit = mode.type === "referral" ? referral : assessment
  const isReferral = mode.type === "referral"
  const residentName = useResidentName(mode.type === "assessment" ? mode.residentId : null)
  const sections = isReferral
    ? SECTIONS
    : SECTIONS.filter((section) => KIND_SECTIONS[mode.kind].includes(section.id))
  const visibleIds = new Set(
    sections.flatMap((section) => [
      ...(section.questions ?? []).map((q) => q.id),
      ...(section.scale?.rows ?? []).map((r) => r.id),
    ]),
  )
  const required = REQUIRED.filter((id) => visibleIds.has(id))
  const DRAFT_KEY = isReferral
    ? "buddii-referral-draft"
    : `buddii-assessment-draft-${mode.residentId}-${mode.kind}`
  const title = isReferral ? "Refer a resident" : ASSESSMENT_KIND_LABEL[mode.kind]
  const [person, setPerson] = useState<Partial<Person>>(EMPTY_PERSON)
  const [answers, setAnswers] = useState<Answers>({})
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const [showErrors, setShowErrors] = useState(false)
  const loaded = useRef(false)

  // Restore a draft once (answers and details only; files are never stored in the browser).
  useEffect(() => {
    if (loaded.current) return
    loaded.current = true
    try {
      const raw = localStorage.getItem(DRAFT_KEY)
      if (!raw) return
      const draft = JSON.parse(raw) as {
        person?: Partial<Person>
        answers?: Answers
        savedAt?: string
      }
      queueMicrotask(() => {
        if (draft.person) setPerson(draft.person)
        if (draft.answers) setAnswers(draft.answers)
        if (draft.savedAt) setSavedAt(draft.savedAt)
      })
    } catch {
      // Storage unavailable: start empty.
    }
  }, [DRAFT_KEY])

  const saveDraft = () => {
    const at = new Date().toISOString()
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ person, answers, savedAt: at }))
      setSavedAt(at)
      toast.success("Draft saved", { description: "Attached files are not kept in the draft." })
    } catch {
      toast.error("Could not save the draft in this browser")
    }
  }

  const rules = useMemo(() => evaluateRules(answers), [answers])
  const idsOf = (s: AssessmentSection) => [
    ...(s.questions ?? []).map((q) => q.id),
    ...(s.scale?.rows ?? []).map((r) => r.id),
  ]
  const rulesFor = (s: AssessmentSection) => rules.filter((r) => idsOf(s).includes(r.on))
  const aAnswered = (["A1", "A2", "A3", "A4"] as const).every((id) => answers[id])
  const aBlocked = rules.some(
    (r) => (r.kind === "stop" || r.kind === "pause") && r.on.startsWith("A"),
  )
  const dBlocked = rules.some((r) => r.kind === "stop" && r.on.startsWith("D"))
  const blocking = rules.filter((r) => r.kind === "stop" || r.kind === "pause")
  const forReviewer = rules.filter((r) => r.kind === "review" || r.kind === "flag")
  const personResult = personSchema.safeParse(person)
  const personOk = !isReferral || personResult.success
  const missing = required.filter(
    (id) => !answers[id] || (Array.isArray(answers[id]) && !(answers[id] as string[]).length),
  )
  const completedBy = session?.user.displayName ?? ""
  const canSend = aAnswered && !blocking.length && personOk && !missing.length && !submit.isPending

  const set = (id: string, value: string | string[] | undefined) =>
    setAnswers((prev) => ({ ...prev, [id]: value }))

  const sectionsDone = sections.filter((s) => sectionComplete(s, answers, person)).length

  const send = async () => {
    setShowErrors(true)
    if (!canSend) {
      toast.error("Check the form", {
        description: "Some answers are missing, or a stop rule applies.",
      })
      return
    }
    const documents = attachments.map((a) => ({
      name: a.file.name,
      size: a.file.size,
      type: a.type,
    }))
    const payloadAnswers = answers as Record<string, string | string[]>
    try {
      if (mode.type === "referral") {
        const created = await referral.mutateAsync({
          person: personResult.data!,
          answers: payloadAnswers,
          documents,
          completedBy,
        })
        toast.success("Sent to the Council", {
          description: `${created.id} for ${created.residentName}. The Council will check the information.`,
        })
        router.push("/assignments")
      } else {
        const created = await assessment.mutateAsync({
          kind: mode.kind,
          answers: payloadAnswers,
          documents,
          completedBy,
        })
        toast.success("Assessment sent to the Council", {
          description: `${created.id}. The Council will check and verify it.`,
        })
        router.push(residentHref(mode.residentId, "assessments"))
      }
      try {
        localStorage.removeItem(DRAFT_KEY)
      } catch {
        // ignore
      }
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not send the referral")
    }
  }

  return (
    <div className="space-y-6">
      <nav
        aria-label="Breadcrumb"
        className="text-xs font-semibold tracking-[0.06em] text-muted-foreground uppercase"
      >
        <Link href="/residents" className="hover:text-heading">
          Residents
        </Link>
        {mode.type === "assessment" && (
          <>
            <ChevronRight className="mx-1.5 inline size-3.5" aria-hidden />
            <Link
              href={residentHref(mode.residentId, "assessments")}
              className="hover:text-heading"
            >
              {residentName}
            </Link>
          </>
        )}
        <ChevronRight className="mx-1.5 inline size-3.5" aria-hidden />
        <span className="text-heading">{title}</span>
      </nav>
      <div className="space-y-1">
        <h1 className="text-[26px] leading-9 font-semibold tracking-tight text-heading">{title}</h1>
        <p className="text-sm text-muted-foreground">
          {isReferral
            ? "Buddii Wellbeing Assessment (v0.2). The Council checks the information, recommends and approves before any support starts."
            : `Buddii Wellbeing Assessment (v0.2) for ${residentName}. G1 to G4 are the outcome measures; ask them in the person's own words. The Council checks and verifies it.`}
        </p>
      </div>

      <p className="flex gap-2.5 rounded-card bg-info-soft px-4 py-3 text-sm text-info-foreground">
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
        Buddii is a non-regulated volunteer service and not an emergency service. If anyone is in
        immediate danger, call 999. Report safeguarding concerns through the local authority route
        straight away; do not wait for this form.
      </p>

      <div className="grid items-start gap-6 xl:grid-cols-[236px_minmax(0,1fr)]">
        {/* Section nav */}
        <aside
          className="sticky top-[88px] hidden rounded-card surface p-4 xl:block"
          aria-label="Form sections"
        >
          <p className="text-xs font-semibold text-muted-foreground uppercase">
            {sectionsDone} of {sections.length} complete
          </p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary"
              style={{ width: `${(sectionsDone / sections.length) * 100}%` }}
            />
          </div>
          <ol className="mt-4 space-y-1">
            {sections.map((s) => {
              const done = sectionComplete(s, answers, person)
              const stopped = rulesFor(s).some((r) => r.kind === "stop" || r.kind === "pause")
              const Icon = stopped ? XCircle : done ? CheckCircle2 : Circle
              return (
                <li key={s.id}>
                  <a
                    href={`#section-${s.id}`}
                    className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] text-foreground hover:bg-muted"
                  >
                    <Icon
                      className={cn(
                        "size-4 shrink-0",
                        stopped
                          ? "text-destructive"
                          : done
                            ? "text-success"
                            : "text-muted-foreground",
                      )}
                      aria-hidden
                    />
                    <span className="truncate">
                      {s.letter}. {s.title}
                    </span>
                  </a>
                </li>
              )
            })}
            {[
              ["documents", "Documents"],
              ["review", "Review and send"],
            ].map(([id, label]) => (
              <li key={id}>
                <a
                  href={`#section-${id}`}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] hover:bg-muted"
                >
                  <Circle className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                  {label}
                </a>
              </li>
            ))}
          </ol>
        </aside>

        <div className="min-w-0 space-y-6">
          {sections.map((section, index) => {
            const locked = section.letter !== "A" && (!aAnswered || aBlocked)
            const stoppedByD = dBlocked && "EFGHIJKL".includes(section.letter)
            return (
              <SectionCard
                key={section.id}
                section={section}
                step={index + 1}
                total={sections.length + 2}
              >
                {section.intro && (
                  <p className="mb-4 text-sm text-muted-foreground">{section.intro}</p>
                )}
                {locked || stoppedByD ? (
                  <NoteBox tone="grey" icon={Lock}>
                    {locked
                      ? "Answer A1 to A4 first. No further information is collected until consent and privacy are confirmed."
                      : "The assessment stops at the safety screen. Deal with the concern first."}
                  </NoteBox>
                ) : (
                  <div className="space-y-6">
                    {section.id === "person" && (
                      <PersonFields person={person} onChange={setPerson} showErrors={showErrors} />
                    )}
                    {section.scale && section.id === "loneliness" && section.questions && (
                      <QuestionField
                        question={section.questions[0]!}
                        answers={answers}
                        onChange={set}
                        showErrors={showErrors}
                      />
                    )}
                    {section.scale && (
                      <ScaleTable
                        columns={section.scale.columns}
                        rows={section.scale.rows}
                        answers={answers}
                        onChange={set}
                      />
                    )}
                    {section.questions
                      ?.filter((q) => !(section.id === "loneliness" && q.id === "G1"))
                      .map((q) => (
                        <QuestionField
                          key={q.id}
                          question={q}
                          answers={answers}
                          onChange={set}
                          showErrors={showErrors}
                        />
                      ))}
                    {section.notes?.map((n) => (
                      <label key={n.id} className="block space-y-1.5">
                        <span className="text-sm font-medium text-heading">
                          {n.label}{" "}
                          <span className="font-normal text-muted-foreground">(optional)</span>
                        </span>
                        <Textarea
                          rows={2}
                          value={(answers[n.id] as string | undefined) ?? ""}
                          onChange={(e) => set(n.id, e.target.value || undefined)}
                        />
                      </label>
                    ))}
                  </div>
                )}
                {rulesFor(section).map((r) => (
                  <RuleNote key={r.message} rule={r} />
                ))}
              </SectionCard>
            )
          })}

          <DocumentsCard
            attachments={attachments}
            onChange={setAttachments}
            step={sections.length + 1}
            total={sections.length + 2}
          />

          <section id="section-review" className="scroll-mt-24 rounded-card surface p-6">
            <p className="text-xs font-semibold text-muted-foreground uppercase">
              Step {sections.length + 2} of {sections.length + 2}
            </p>
            <h2 className="mt-1 text-lg font-semibold text-heading">Review and send</h2>
            <div className="my-4 h-px bg-border" />
            <dl className="grid gap-3 sm:grid-cols-3">
              <Summary
                label="Required answers"
                value={missing.length ? `${missing.length} missing` : "Complete"}
                bad={missing.length > 0}
              />
              <Summary label="Not known answers" value={`${notKnownCount(answers)} to follow up`} />
              <Summary label="Documents" value={String(attachments.length)} />
            </dl>
            <div className="mt-4 space-y-2">
              {isReferral && !personResult.success && showErrors && (
                <NoteBox tone="red" icon={AlertTriangle}>
                  Section B: {personResult.error.issues[0]?.message}
                </NoteBox>
              )}
              {missing.length > 0 && showErrors && (
                <NoteBox tone="red" icon={AlertTriangle}>
                  Answer {missing.join(", ")} before sending.
                </NoteBox>
              )}
              {blocking.map((r) => (
                <RuleNote key={r.message} rule={r} />
              ))}
              {forReviewer.length > 0 && (
                <NoteBox tone="amber" icon={Info}>
                  The Council reviewer will check {forReviewer.length}{" "}
                  {forReviewer.length === 1 ? "answer" : "answers"} before a plan is drafted.
                </NoteBox>
              )}
              <NoteBox tone="grey" icon={Info}>
                This form records needs as reported. It does not decide eligibility for council
                services, authorise regulated care or replace a Care Act needs assessment. Completed
                by {completedBy || "you"}.
              </NoteBox>
            </div>
          </section>
        </div>
      </div>

      {/* Sticky footer */}
      <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-card surface px-5 py-3">
        <p className="text-xs text-muted-foreground">
          {savedAt ? `Draft saved at ${formatTime(savedAt)}` : "Not saved yet"}
        </p>
        <div className="flex gap-2">
          <Button asChild variant="ghost">
            <Link href="/residents">Cancel</Link>
          </Button>
          <Button variant="outline" onClick={saveDraft}>
            Save draft
          </Button>
          <Button onClick={send} disabled={submit.isPending}>
            {submit.isPending ? <Spinner /> : <Send aria-hidden />}
            Send to Council
          </Button>
        </div>
      </div>
    </div>
  )
}

function sectionComplete(s: AssessmentSection, a: Answers, person: Partial<Person>) {
  const ids = [...(s.questions ?? []).map((q) => q.id), ...(s.scale?.rows ?? []).map((r) => r.id)]
  const answered = ids.every((id) => a[id] && (!Array.isArray(a[id]) || (a[id] as string[]).length))
  return s.id === "person" ? answered && personSchema.safeParse(person).success : answered
}

function SectionCard({
  section,
  step,
  total,
  children,
}: {
  section: AssessmentSection
  step: number
  total: number
  children: React.ReactNode
}) {
  return (
    <section id={`section-${section.id}`} className="scroll-mt-24 rounded-card surface p-6">
      <p className="text-xs font-semibold text-muted-foreground uppercase">
        Step {step} of {total} · Section {section.letter}
      </p>
      <h2 className="mt-1 text-lg font-semibold text-heading">{section.title}</h2>
      <div className="my-4 h-px bg-border" />
      {children}
    </section>
  )
}

function QuestionField({
  question: q,
  answers,
  onChange,
  showErrors,
}: {
  question: Question
  answers: Answers
  onChange: (id: string, value: string | string[] | undefined) => void
  showErrors: boolean
}) {
  const value = answers[q.id]
  const required = (REQUIRED as readonly string[]).includes(q.id)
  const empty = !value || (Array.isArray(value) && !value.length)
  const otherChosen = Array.isArray(value) ? value.includes("Other") : value === "Other"
  const labelId = `q-${q.id}`

  return (
    <fieldset className="space-y-2.5" aria-labelledby={labelId}>
      <legend id={labelId} className="text-sm font-medium text-heading">
        <span className="mr-1.5 text-muted-foreground tabular-nums">{q.id.replace("_", " ")}.</span>{" "}
        {q.label}{" "}
        <span className="font-normal text-muted-foreground">
          ({q.multiple ? "tick all that apply" : "tick one"})
        </span>
      </legend>
      {q.multiple ? (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {q.options.map((opt) => {
            const checked = Array.isArray(value) && value.includes(opt)
            return (
              <label
                key={opt}
                className="flex cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2.5 text-sm has-data-[state=checked]:border-primary has-data-[state=checked]:bg-accent/50"
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={(next) => {
                    const list = Array.isArray(value) ? value : []
                    onChange(q.id, next === true ? [...list, opt] : list.filter((v) => v !== opt))
                  }}
                  className="mt-0.5"
                />
                {opt}
              </label>
            )
          })}
        </div>
      ) : (
        <RadioGroup
          value={(value as string | undefined) ?? ""}
          onValueChange={(v) => onChange(q.id, v)}
          className="flex flex-wrap gap-2"
        >
          {q.options.map((opt) => (
            <label
              key={opt}
              className="flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm has-data-[state=checked]:border-primary has-data-[state=checked]:bg-accent/50"
            >
              <RadioGroupItem value={opt} />
              {opt}
            </label>
          ))}
        </RadioGroup>
      )}
      {q.other && otherChosen && (
        <Input
          aria-label={`${q.id} other`}
          placeholder="Please say"
          className="h-10 max-w-md"
          value={(answers[`${q.id}_other`] as string | undefined) ?? ""}
          onChange={(e) => onChange(`${q.id}_other`, e.target.value || undefined)}
        />
      )}
      {required && empty && showErrors && (
        <p className="text-xs text-destructive">This answer is required.</p>
      )}
    </fieldset>
  )
}

function ScaleTable({
  columns,
  rows,
  answers,
  onChange,
}: {
  columns: readonly string[]
  rows: { id: string; label: string }[]
  answers: Answers
  onChange: (id: string, value: string) => void
}) {
  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <fieldset key={row.id} className="space-y-2" aria-labelledby={`q-${row.id}`}>
          <legend id={`q-${row.id}`} className="text-sm font-medium text-heading">
            <span className="mr-1.5 text-muted-foreground tabular-nums">{row.id}.</span> {row.label}{" "}
            <span className="font-normal text-muted-foreground">(tick one)</span>
          </legend>
          <RadioGroup
            value={(answers[row.id] as string | undefined) ?? ""}
            onValueChange={(v) => onChange(row.id, v)}
            className="flex flex-wrap gap-2"
          >
            {columns.map((col) => (
              <label
                key={col}
                className="flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm has-data-[state=checked]:border-primary has-data-[state=checked]:bg-accent/50"
              >
                <RadioGroupItem value={col} />
                {col}
              </label>
            ))}
          </RadioGroup>
        </fieldset>
      ))}
    </div>
  )
}

function PersonFields({
  person,
  onChange,
  showErrors,
}: {
  person: Partial<Person>
  onChange: (p: Partial<Person>) => void
  showErrors: boolean
}) {
  const result = personSchema.safeParse(person)
  const errorFor = (id: keyof Person) =>
    !result.success && showErrors
      ? result.error.issues.find((i) => i.path[0] === id)?.message
      : undefined

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {PERSON_FIELDS.map((f) => (
          <label key={f.id} className="space-y-1.5">
            <span className="text-sm font-medium text-heading">
              {f.label}{" "}
              {f.optional && <span className="font-normal text-muted-foreground">(optional)</span>}
            </span>
            <Input
              type={f.type ?? "text"}
              className="h-10"
              placeholder={f.placeholder}
              value={(person[f.id] as string | undefined) ?? ""}
              aria-invalid={Boolean(errorFor(f.id))}
              onChange={(e) => onChange({ ...person, [f.id]: e.target.value || undefined })}
            />
            {errorFor(f.id) && <span className="text-xs text-destructive">{errorFor(f.id)}</span>}
          </label>
        ))}
        <label className="space-y-1.5">
          <span className="text-sm font-medium text-heading">Interpreter needed?</span>
          <Select
            value={person.interpreterNeeded ?? ""}
            onValueChange={(v) => onChange({ ...person, interpreterNeeded: v as "Yes" | "No" })}
          >
            <SelectTrigger className="h-10 w-full">
              <SelectValue placeholder="Select…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="No">No</SelectItem>
              <SelectItem value="Yes">Yes</SelectItem>
            </SelectContent>
          </Select>
        </label>
      </div>
      <NoteBox tone="grey" icon={Lock}>
        NHS number is not collected; Buddii does not need it to provide companionship.
      </NoteBox>
    </div>
  )
}

function DocumentsCard({
  attachments,
  onChange,
  step,
  total,
}: {
  attachments: Attachment[]
  onChange: (a: Attachment[]) => void
  step: number
  total: number
}) {
  const [type, setType] = useState<DocumentType>("Care or support plan")
  const input = useRef<HTMLInputElement>(null)

  const add = (files: FileList | null) => {
    if (!files) return
    const next = [...attachments]
    for (const file of Array.from(files)) {
      if (file.size > MAX_FILE_BYTES) {
        toast.error(`${file.name} is larger than 10 MB`)
        continue
      }
      next.push({ id: `${file.name}-${file.size}-${Date.now()}`, file, type })
    }
    onChange(next)
    if (input.current) input.current.value = ""
  }

  return (
    <section id="section-documents" className="scroll-mt-24 rounded-card surface p-6">
      <p className="text-xs font-semibold text-muted-foreground uppercase">
        Step {step} of {total}
      </p>
      <h2 className="mt-1 text-lg font-semibold text-heading">Documents</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Attach the current care or support plan and anything else the Council needs. PDF, Word, JPG
        or PNG, up to 10 MB each. Only the Council sees these.
      </p>
      <div className="my-4 h-px bg-border" />
      <div className="flex flex-wrap items-end gap-3">
        <label className="space-y-1.5">
          <span className="text-sm font-medium text-heading">Document type</span>
          <Select value={type} onValueChange={(v) => setType(v as DocumentType)}>
            <SelectTrigger className="h-10 w-64">
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
          multiple
          className="sr-only"
          id="referral-files"
          aria-label="Choose files to attach"
          onChange={(e) => add(e.target.files)}
        />
        <Button variant="outline" className="h-10" onClick={() => input.current?.click()}>
          <Paperclip aria-hidden />
          Choose files
        </Button>
      </div>
      {attachments.length > 0 && (
        <ul className="mt-4 divide-y rounded-lg border">
          {attachments.map((a) => (
            <li key={a.id} className="flex items-center gap-3 px-4 py-3">
              <FileText className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-heading">{a.file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {a.type} · {(a.file.size / 1024).toFixed(0)} KB
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Remove ${a.file.name}`}
                onClick={() => onChange(attachments.filter((x) => x.id !== a.id))}
              >
                <Trash2 aria-hidden />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function Summary({ label, value, bad }: { label: string; value: string; bad?: boolean }) {
  return (
    <div className="rounded-lg border px-4 py-3">
      <dt className="text-xs font-semibold text-muted-foreground uppercase">{label}</dt>
      <dd className={cn("mt-1 text-sm font-semibold", bad ? "text-destructive" : "text-heading")}>
        {value}
      </dd>
    </div>
  )
}

function RuleNote({ rule }: { rule: GateResult }) {
  const tone =
    rule.kind === "stop"
      ? "red"
      : rule.kind === "pause"
        ? "amber"
        : rule.kind === "review"
          ? "amber"
          : "grey"
  const label = { stop: "Stop", pause: "Pause", review: "For the reviewer", flag: "Flag" }[
    rule.kind
  ]
  return (
    <NoteBox tone={tone} icon={rule.kind === "stop" ? XCircle : AlertTriangle} className="mt-4">
      <span className="font-semibold">
        {label} ({rule.on.replace("_", " ")}).
      </span>{" "}
      {rule.message}
    </NoteBox>
  )
}

function NoteBox({
  tone,
  icon: Icon,
  className,
  children,
}: {
  tone: "grey" | "amber" | "red"
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>
  className?: string
  children: React.ReactNode
}) {
  return (
    <p
      className={cn(
        "flex gap-2.5 rounded-lg px-3 py-2.5 text-xs leading-relaxed font-medium",
        tone === "grey" && "bg-muted text-foreground",
        tone === "amber" && "bg-warning-soft text-warning-foreground",
        tone === "red" && "bg-destructive-soft text-destructive-foreground",
        className,
      )}
    >
      <Icon className="mt-0.5 size-3.5 shrink-0" aria-hidden />
      <span>{children}</span>
    </p>
  )
}
