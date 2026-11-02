import { delay } from "msw"
import { http, HttpResponse } from "msw/http"

import { type ActivityFilter } from "@/features/activity/schemas"
import { type Assignment } from "@/features/assignments/schemas"
import { isLocked } from "@/features/clients/presentation"
import { type ClientDetail } from "@/features/clients/schemas"
import { type NewReferral, type Referral } from "@/features/referrals/schemas"
import { type Concern, type NewConcern } from "@/features/safeguarding/schemas"
import { type InviteUser, type NotificationSettings } from "@/features/settings/schemas"
import {
  REQUEST_STATUSES,
  type NewSupportRequest,
  type SupportRequest,
} from "@/features/support-requests/schemas"
import { env } from "@/lib/env"

import { db, mockAuth, nextId, nowIso, todayIso } from "./db"

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

  // Clients
  http.get(api("/clients"), async ({ request }) => {
    await delay()
    const params = new URL(request.url).searchParams
    const status = params.get("status")
    const needsResponse = params.get("needs_response") === "true"
    const closed = params.get("closed") === "true"
    const area = params.get("area")
    const search = params.get("search")?.toLowerCase()
    const page = Number(params.get("page") ?? 1)

    const filtered = db.clients.filter(
      (client) =>
        // Closed and deceased records only appear in the closed view.
        isLocked(client.programmeStatus) === closed &&
        (!status || client.programmeStatus === status) &&
        (!area || client.postcodeDistrict === area) &&
        (!needsResponse || client.needsProviderResponse) &&
        (!search ||
          client.id.toLowerCase().includes(search) ||
          client.postcodeDistrict.toLowerCase().includes(search) ||
          client.supportGoals.some((goal) => goal.toLowerCase().includes(search))),
    )
    const start = (page - 1) * PAGE_SIZE
    return HttpResponse.json({
      count: filtered.length,
      next: start + PAGE_SIZE < filtered.length ? `?page=${page + 1}` : null,
      previous: page > 1 ? `?page=${page - 1}` : null,
      results: filtered.slice(start, start + PAGE_SIZE),
    })
  }),

  http.get(api("/clients/:id"), async ({ params }) => {
    await delay()
    const client = db.clients.find((c) => c.id === params.id)
    if (!client) return notFound()
    const detail: ClientDetail = {
      ...client,
      permittedActivities: [
        "Companionship visit",
        "Telephone check-in",
        "Social engagement",
        "Community activity",
        "Light practical support",
      ],
      consent: {
        status: client.consentStatus,
        lawfulBasis: "Public task (Care Act 2014)",
        recordedAt: client.consentStatus === "GIVEN" ? "2026-09-01" : null,
        recordedBy: client.consentStatus === "GIVEN" ? "Sarah M." : null,
      },
      history: [
        ...(client.programmeStatus === "DECEASED"
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
          .filter((a) => a.clientId === client.id && a.status === "COMPLETED")
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
    const clientId = params.get("client")
    const scoped = clientId ? db.activity.filter((a) => a.clientId === clientId) : db.activity
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
    const client = db.clients.find((c) => c.id === record.clientId)
    if (client) client.needsProviderResponse = false
    db.dashboard.actions = db.dashboard.actions.filter(
      (a) => a.relatedTo.ref !== record.clientId || a.cta !== "RESPOND",
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
    const clientId = params.get("client")
    const scoped = clientId
      ? db.supportRequests.filter((r) => r.clientId === clientId)
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
    const client = db.clients.find((c) => c.id === body.clientId)
    if (client && isLocked(client.programmeStatus)) {
      return HttpResponse.json({ detail: "This client record is closed." }, { status: 409 })
    }
    const created: SupportRequest = {
      id: nextId("SR-2026"),
      clientId: body.clientId,
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

  // Referrals (provider -> council)
  http.get(api("/referrals"), async () => {
    await delay()
    return HttpResponse.json(db.referrals)
  }),

  http.post(api("/referrals"), async ({ request }) => {
    await delay()
    const body = (await request.json()) as NewReferral
    const created: Referral = {
      id: nextId("REF-2026"),
      providerRef: body.providerRef,
      ageBand: body.ageBand,
      postcodeDistrict: body.postcodeDistrict,
      supportTypes: body.supportTypes,
      status: "SUBMITTED",
      submittedAt: todayIso(),
      clientId: null,
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
