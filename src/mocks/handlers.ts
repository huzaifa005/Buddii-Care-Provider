import { delay } from "msw"
import { http, HttpResponse } from "msw/http"

import { type ActionReplyInput } from "@/features/action-centre/schemas"
import { type ActivityFilter } from "@/features/activity/schemas"
import { type Assignment } from "@/features/assignments/schemas"
import { evaluateRules, notKnownCount } from "@/features/referrals/assessment"
import { type Referral, type ReferralSubmission } from "@/features/referrals/schemas"
import {
  type AssessmentRecord,
  type NewAssessment,
  type NewDocument,
  type ResidentDocument,
} from "@/features/resident-records/schemas"
import { isLocked } from "@/features/residents/presentation"
import { type ResidentDetail } from "@/features/residents/schemas"
import { type Concern, type NewConcern } from "@/features/safeguarding/schemas"
import { type InviteUser, type NotificationSettings } from "@/features/settings/schemas"
import {
  REQUEST_STATUSES,
  type NewSupportRequest,
  type SupportRequest,
} from "@/features/support-requests/schemas"
import { env } from "@/lib/env"

import { buildActions, replyToAction } from "./action-centre"
import { db, mockAuth, nextId, nowIso, todayIso } from "./db"
import { outcomeAssessmentsFixture } from "./fixtures/outcome-assessments"

const api = (path: string) => `${env.NEXT_PUBLIC_API_URL.replace(/\/$/, "")}${path}`
const PAGE_SIZE = 20
export const MOCK_PASSWORD = "buddii-demo"
const notFound = () => HttpResponse.json({ detail: "Not found." }, { status: 404 })
const ukDate = (iso: string) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London" }).format(new Date(iso))

function matchesActivityFilter(filter: ActivityFilter, a: (typeof db.activity)[number]) {
  const today = todayIso()
  switch (filter) {
    case "today":
      return ukDate(a.scheduledAt) === today
    case "upcoming":
      return a.status === "SCHEDULED" && ukDate(a.scheduledAt) >= today
    case "needs_response":
      return a.needsResponse
    case "missed":
      return a.status === "MISSED"
    default:
      return true
  }
}

/** Stores an upload; a document of the same type becomes the next version. */
function addDocument(residentId: string, doc: NewDocument, uploadedBy: string) {
  const versions = db.documents.filter((d) => d.residentId === residentId && d.type === doc.type)
  const created: ResidentDocument = {
    id: nextId("DOC"),
    residentId,
    name: doc.name,
    size: doc.size,
    type: doc.type,
    version: versions.length + 1,
    uploadedAt: todayIso(),
    uploadedBy,
    status: "RECEIVED",
  }
  db.documents.unshift(created)
  return created
}

/** Mirrors the DRF contract so swapping to the real API is a config change, not a code change. */
export const handlers = [
  // Auth (Django session). Demo password for the mock: "buddii-demo".
  http.post(api("/auth/login"), async ({ request }) => {
    await delay()
    const { email, password } = (await request.json()) as { email: string; password: string }
    if (!email || password !== MOCK_PASSWORD) {
      return HttpResponse.json({ detail: "Invalid credentials." }, { status: 400 })
    }
    mockAuth.set(true)
    return new HttpResponse(null, { status: 204 })
  }),

  http.post(api("/auth/logout"), async () => {
    mockAuth.set(false)
    return new HttpResponse(null, { status: 204 })
  }),

  http.get(api("/me"), async () => {
    await delay()
    if (!mockAuth.isSignedIn()) {
      return HttpResponse.json(
        { detail: "Authentication credentials were not provided." },
        { status: 401 },
      )
    }
    return HttpResponse.json(db.session)
  }),

  // Notifications
  http.get(api("/notifications"), async () => {
    await delay()
    return HttpResponse.json(db.inbox)
  }),

  http.post(api("/notifications/read-all"), async () => {
    db.inbox.forEach((n) => (n.read = true))
    return new HttpResponse(null, { status: 204 })
  }),

  http.get(api("/dashboard/summary"), async () => {
    await delay()
    const pending = db.assignments.filter((a) => a.status === "PENDING")
    return HttpResponse.json({ ...db.dashboard, pendingAssignments: pending })
  }),

  // Residents
  http.get(api("/residents"), async ({ request }) => {
    await delay()
    const params = new URL(request.url).searchParams
    const status = params.get("status")
    const needsResponse = params.get("needs_response") === "true"
    const awaitingMatch = params.get("awaiting_match") === "true"
    const closed = params.get("closed") === "true"
    const area = params.get("area")
    const search = params.get("search")?.toLowerCase()
    const page = Number(params.get("page") ?? 1)

    const filtered = db.residents.filter(
      (resident) =>
        // Closed and deceased records only appear in the closed view.
        isLocked(resident.programmeStatus) === closed &&
        (!status || resident.programmeStatus === status) &&
        (!area || resident.area === area) &&
        (!needsResponse || resident.needsProviderResponse) &&
        (!awaitingMatch || resident.volunteerMatchStatus === "AWAITING_MATCH") &&
        (!search ||
          resident.id.toLowerCase().includes(search) ||
          resident.name.toLowerCase().includes(search) ||
          resident.area.toLowerCase().includes(search) ||
          resident.postcodeDistrict.toLowerCase().includes(search) ||
          resident.supportGoals.some((goal) => goal.toLowerCase().includes(search))),
    )
    const start = (page - 1) * PAGE_SIZE
    return HttpResponse.json({
      count: filtered.length,
      next: start + PAGE_SIZE < filtered.length ? `?page=${page + 1}` : null,
      previous: page > 1 ? `?page=${page - 1}` : null,
      results: filtered.slice(start, start + PAGE_SIZE),
    })
  }),

  http.get(api("/residents/directory"), async () => {
    await delay()
    return HttpResponse.json(db.residents.map(({ id, name }) => ({ id, name })))
  }),

  http.get(api("/residents/:id"), async ({ params }) => {
    await delay()
    const resident = db.residents.find((c) => c.id === params.id)
    if (!resident) return notFound()
    const detail: ResidentDetail = {
      ...resident,
      permittedActivities: [
        "Companionship visit",
        "Telephone check-in",
        "Social engagement",
        "Community activity",
        "Light practical support",
      ],
      consent: {
        status: resident.consentStatus,
        lawfulBasis: "Public task (Care Act 2014)",
        recordedAt: resident.consentStatus === "GIVEN" ? "2026-09-01" : null,
        recordedBy: resident.consentStatus === "GIVEN" ? "Sarah M." : null,
      },
      history: [
        ...(resident.programmeStatus === "DECEASED"
          ? [
              {
                id: "h-closed",
                at: "2026-10-02T11:15:00+01:00",
                event: "Record closed by the council. Volunteer activity and alerts stopped.",
                actor: "Council",
                kind: "STATUS" as const,
              },
            ]
          : []),
        ...db.activity
          .filter((a) => a.residentId === resident.id && a.status === "COMPLETED")
          .slice(0, 3)
          .map((a) => ({
            id: `h-${a.id}`,
            at: a.scheduledAt,
            event: `${a.type} completed by ${a.volunteerRef}`,
            actor: "Volunteer",
            kind: "ACTIVITY" as const,
          })),
        {
          id: "h-req",
          at: "2026-09-08T10:00:00+01:00",
          event: "Support request matched with a volunteer",
          actor: "Volunteer Coordinator",
          kind: "REQUEST",
        },
        {
          id: "h-consent",
          at: "2026-09-01T09:30:00+01:00",
          event: "Consent recorded",
          actor: "Sarah M.",
          kind: "CONSENT",
        },
        {
          id: "h-asn",
          at: "2026-08-28T14:00:00+01:00",
          event: "Programme participation confirmed",
          actor: "Sarah M.",
          kind: "ASSIGNMENT",
        },
      ],
    }
    return HttpResponse.json(detail)
  }),

  // Volunteer activity
  http.get(api("/activity"), async ({ request }) => {
    await delay()
    const params = new URL(request.url).searchParams
    const filter = (params.get("filter") ?? "all") as ActivityFilter
    const residentId = params.get("resident")
    const scoped = residentId ? db.activity.filter((a) => a.residentId === residentId) : db.activity
    const filters: ActivityFilter[] = ["all", "today", "upcoming", "needs_response", "missed"]
    const completed = db.activity.filter((a) => a.status === "COMPLETED")
    return HttpResponse.json({
      counts: Object.fromEntries(
        filters.map((f) => [f, scoped.filter((a) => matchesActivityFilter(f, a)).length]),
      ),
      stats: {
        completedThisMonth: completed.length + 31,
        hoursThisMonth: 47,
        upcomingSevenDays: db.activity.filter((a) => matchesActivityFilter("upcoming", a)).length,
        awaitingResponse: db.activity.filter((a) => a.needsResponse).length,
      },
      results: scoped
        .filter((a) => matchesActivityFilter(filter, a))
        .sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt)),
    })
  }),

  http.post(api("/activity/:id/response"), async ({ params, request }) => {
    await delay()
    const record = db.activity.find((a) => a.id === params.id)
    if (!record) return notFound()
    const body = (await request.json()) as { response: string }
    record.needsResponse = false
    record.providerResponse = {
      text: body.response,
      respondedAt: nowIso(),
      by: db.session.user.displayName,
    }
    const resident = db.residents.find((c) => c.id === record.residentId)
    if (resident) resident.needsProviderResponse = false
    db.dashboard.actions = db.dashboard.actions.filter(
      (a) => a.relatedTo.ref !== record.residentId || a.cta !== "RESPOND",
    )
    return HttpResponse.json(record)
  }),

  // Council assignments
  http.get(api("/assignments"), async ({ request }) => {
    await delay()
    const status = new URL(request.url).searchParams.get("status") ?? "PENDING"
    const count = (s: Assignment["status"]) => db.assignments.filter((a) => a.status === s).length
    return HttpResponse.json({
      counts: {
        PENDING: count("PENDING"),
        CONFIRMED: count("CONFIRMED"),
        DECLINED: count("DECLINED"),
      },
      results: db.assignments.filter((a) => a.status === status),
    })
  }),

  http.post(api("/assignments/:id/:decision"), async ({ params, request }) => {
    await delay()
    const assignment = db.assignments.find((a) => a.id === params.id)
    if (!assignment) return notFound()
    if (assignment.status !== "PENDING") {
      return HttpResponse.json(
        { detail: "This assignment has already been answered." },
        { status: 409 },
      )
    }
    const body = (await request.json()) as { reason?: string }
    assignment.status = params.decision === "confirm" ? "CONFIRMED" : "DECLINED"
    assignment.respondedAt = todayIso()
    assignment.declineReason = params.decision === "decline" ? (body.reason ?? null) : null
    db.dashboard.actions = db.dashboard.actions.filter((a) => a.relatedTo.ref !== assignment.id)
    return HttpResponse.json(assignment)
  }),

  // Support requests
  http.get(api("/support-requests"), async ({ request }) => {
    await delay()
    const params = new URL(request.url).searchParams
    const status = params.get("status")
    const residentId = params.get("resident")
    const scoped = residentId
      ? db.supportRequests.filter((r) => r.residentId === residentId)
      : db.supportRequests
    return HttpResponse.json({
      counts: Object.fromEntries(
        REQUEST_STATUSES.map((s) => [s, scoped.filter((r) => r.status === s).length]),
      ),
      results: status ? scoped.filter((r) => r.status === status) : scoped,
    })
  }),

  http.post(api("/support-requests"), async ({ request }) => {
    await delay()
    const body = (await request.json()) as NewSupportRequest
    const resident = db.residents.find((c) => c.id === body.residentId)
    if (resident && isLocked(resident.programmeStatus)) {
      return HttpResponse.json({ detail: "This resident record is closed." }, { status: 409 })
    }
    const created: SupportRequest = {
      id: nextId("SR-2026"),
      residentId: body.residentId,
      type: body.type,
      goal: body.goal,
      frequency: body.frequency,
      preferredTime: body.preferredTime,
      riskLevel: body.riskLevel,
      status: "COORDINATOR_REVIEW",
      volunteerRef: null,
      createdAt: todayIso(),
      reviewDate: null,
    }
    db.supportRequests.unshift(created)
    return HttpResponse.json(created, { status: 201 })
  }),

  // Resident records: wellbeing assessments and documents shared with the Council
  http.get(api("/residents/:id/assessments"), async ({ params }) => {
    await delay()
    return HttpResponse.json(
      db.assessments
        .filter((a) => a.residentId === params.id)
        .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)),
    )
  }),

  http.post(api("/residents/:id/assessments"), async ({ params, request }) => {
    await delay()
    const residentId = String(params.id)
    const body = (await request.json()) as NewAssessment
    const rules = evaluateRules(body.answers)
    if (rules.some((r) => r.kind === "stop" || r.kind === "pause")) {
      return HttpResponse.json(
        { detail: "This assessment has a stop or pause rule and cannot be sent yet." },
        { status: 400 },
      )
    }
    const created: AssessmentRecord = {
      id: nextId("WA-2026"),
      residentId,
      kind: body.kind,
      status: "RECEIVED",
      submittedAt: todayIso(),
      completedBy: body.completedBy,
      reviewFlags: rules.length,
      notKnown: notKnownCount(body.answers),
      answers: body.answers,
      councilNote: null,
    }
    db.assessments.unshift(created)
    for (const doc of body.documents) addDocument(residentId, doc, body.completedBy)
    return HttpResponse.json(created, { status: 201 })
  }),

  http.get(api("/residents/:id/documents"), async ({ params }) => {
    await delay()
    return HttpResponse.json(
      db.documents
        .filter((d) => d.residentId === params.id)
        .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt)),
    )
  }),

  http.post(api("/residents/:id/documents"), async ({ params, request }) => {
    await delay()
    const body = (await request.json()) as NewDocument
    const created = addDocument(String(params.id), body, db.session.user.displayName)
    return HttpResponse.json(created, { status: 201 })
  }),

  // Referrals (provider -> council)
  http.get(api("/referrals"), async () => {
    await delay()
    return HttpResponse.json(db.referrals)
  }),

  http.post(api("/referrals"), async ({ request }) => {
    await delay()
    const body = (await request.json()) as ReferralSubmission
    const rules = evaluateRules(body.answers)
    if (rules.some((r) => r.kind === "stop" || r.kind === "pause")) {
      return HttpResponse.json(
        { detail: "This assessment has a stop or pause rule and cannot be sent yet." },
        { status: 400 },
      )
    }
    const created: Referral = {
      id: nextId("REF-2026"),
      residentName: body.person.fullName,
      postcode: body.person.postcode,
      stage: "SENT",
      submittedAt: todayIso(),
      documents: body.documents,
      reviewFlags: rules.length,
      residentId: null,
      councilNote: null,
    }
    db.referrals.unshift(created)
    return HttpResponse.json(created, { status: 201 })
  }),

  http.post(api("/support-requests/:id/cancel"), async ({ params }) => {
    await delay()
    const req = db.supportRequests.find((r) => r.id === params.id)
    if (!req) return notFound()
    req.status = "CANCELLED"
    return HttpResponse.json(req)
  }),

  // Safeguarding
  http.get(api("/safeguarding/concerns"), async () => {
    await delay()
    return HttpResponse.json(db.concerns)
  }),

  http.post(api("/safeguarding/concerns"), async ({ request }) => {
    await delay()
    const body = (await request.json()) as NewConcern
    const at = nowIso()
    const concern: Concern = {
      id: nextId("SC-2026"),
      ...body,
      status: "ROUTED",
      routedTo: "Volunteer Coordinator",
      raisedAt: at,
      raisedBy: db.session.user.displayName,
      timeline: [
        { at, event: `Concern raised by ${db.session.user.displayName}` },
        { at, event: "Routed to the Volunteer Coordinator" },
      ],
    }
    db.concerns.unshift(concern)
    return HttpResponse.json(concern, { status: 201 })
  }),

  // Messages
  http.get(api("/messages/threads"), async () => {
    await delay()
    return HttpResponse.json(db.threads)
  }),

  http.post(api("/messages/threads/:id/messages"), async ({ params, request }) => {
    await delay(300)
    const thread = db.threads.find((t) => t.id === params.id)
    if (!thread) return notFound()
    const { body } = (await request.json()) as { body: string }
    const message = {
      id: nextId("m"),
      from: "PROVIDER" as const,
      author: db.session.user.displayName,
      body,
      sentAt: nowIso(),
    }
    thread.messages.push(message)
    return HttpResponse.json(message, { status: 201 })
  }),

  http.post(api("/messages/threads/:id/read"), async ({ params }) => {
    const thread = db.threads.find((t) => t.id === params.id)
    if (thread) thread.unread = 0
    return new HttpResponse(null, { status: 204 })
  }),

  // Outcomes and reports
  http.get(api("/outcomes/summary"), async () => {
    await delay()
    return HttpResponse.json(db.outcomes)
  }),

  // Action Centre
  http.get(api("/action-centre/actions"), async () => {
    await delay()
    return HttpResponse.json(buildActions())
  }),

  http.post(api("/action-centre/actions/:id/reply"), async ({ params, request }) => {
    await delay()
    const action = buildActions().find((a) => a.id === params.id)
    if (!action) return notFound()
    if (!action.canReply) {
      return HttpResponse.json(
        { detail: "This action is completed from its source record." },
        { status: 409 },
      )
    }
    const input = (await request.json()) as ActionReplyInput
    if (!input.message?.trim()) {
      return HttpResponse.json({ message: ["Write a reply for the Council."] }, { status: 400 })
    }
    const by = db.session.user.displayName
    replyToAction(action, input, by)
    // Files sent for a resident land in their Documents tab, waiting for the Council to verify.
    if (action.residentId) {
      for (const file of input.files) addDocument(action.residentId, file, by)
    }
    return HttpResponse.json(buildActions().find((a) => a.id === action.id))
  }),

  http.get(api("/outcomes/assessments"), async () => {
    await delay()
    return HttpResponse.json(outcomeAssessmentsFixture)
  }),

  http.get(api("/reports"), async () => {
    await delay()
    return HttpResponse.json(db.reports)
  }),

  http.post(api("/reports/:id/generate"), async ({ params }) => {
    await delay(900)
    const report = db.reports.find((r) => r.id === params.id)
    if (!report) return notFound()
    report.lastGeneratedAt = nowIso()
    return HttpResponse.json(report)
  }),

  // Users and settings
  http.get(api("/users"), async () => {
    await delay()
    return HttpResponse.json(db.users)
  }),

  http.post(api("/users/invite"), async ({ request }) => {
    await delay()
    const body = (await request.json()) as InviteUser
    if (db.users.some((u) => u.email.toLowerCase() === body.email.toLowerCase())) {
      return HttpResponse.json(
        { detail: "A user with this email already exists." },
        { status: 400 },
      )
    }
    const user = { id: nextId("usr"), ...body, status: "INVITED" as const, lastActiveAt: null }
    db.users.push(user)
    return HttpResponse.json(user, { status: 201 })
  }),

  http.get(api("/settings/organisation"), async () => {
    await delay()
    return HttpResponse.json(db.organisation)
  }),

  http.get(api("/settings/notifications"), async () => {
    await delay()
    return HttpResponse.json(db.notifications)
  }),

  http.put(api("/settings/notifications"), async ({ request }) => {
    await delay()
    db.notifications = (await request.json()) as NotificationSettings
    return HttpResponse.json(db.notifications)
  }),
]
