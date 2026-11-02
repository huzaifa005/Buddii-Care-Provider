/**
 * Generates docs/api/openapi.json from the zod schemas the frontend validates against.
 * The schemas are the contract: if the backend response does not match, the UI rejects it.
 *
 *   npm run openapi
 */
import { mkdirSync, writeFileSync } from "node:fs"
import path from "node:path"

import { z } from "zod"

import {
  activityListSchema,
  activityRecordSchema,
  providerResponseInputSchema,
} from "@/features/activity/schemas"
import {
  assignmentListSchema,
  assignmentSchema,
  confirmAssignmentInputSchema,
  declineAssignmentInputSchema,
} from "@/features/assignments/schemas"
import { loginSchema } from "@/features/auth/schemas"
import { clientDetailSchema, clientSchema, programmeStatusSchema } from "@/features/clients/schemas"
import { dashboardSummarySchema } from "@/features/home/schemas"
import { messageSchema, newMessageSchema, threadSchema } from "@/features/messages/schemas"
import { notificationSchema } from "@/features/notifications/schemas"
import { outcomesSummarySchema } from "@/features/outcomes/schemas"
import { newReferralSchema, referralListSchema, referralSchema } from "@/features/referrals/schemas"
import { REPORT_PERIODS, reportSchema } from "@/features/reports/schemas"
import { concernSchema, newConcernSchema } from "@/features/safeguarding/schemas"
import { type Capability } from "@/features/session/permissions"
import { sessionSchema } from "@/features/session/schemas"
import {
  inviteUserSchema,
  notificationSettingsSchema,
  organisationSchema,
  providerUserSchema,
} from "@/features/settings/schemas"
import {
  newSupportRequestSchema,
  REQUEST_STATUSES,
  supportRequestListSchema,
  supportRequestSchema,
} from "@/features/support-requests/schemas"
import { paginatedSchema } from "@/lib/api/pagination"

type Method = "get" | "post" | "put" | "patch" | "delete"

interface Endpoint {
  method: Method
  path: string
  tag: string
  summary: string
  description?: string
  query?: { name: string; schema: z.ZodType; description: string }[]
  body?: z.ZodType
  response?: { status: number; schema?: z.ZodType; description: string }
  errors?: number[]
  /** Role capability the API must check (see docs/BACKEND_INTEGRATION.md). */
  capability?: Capability
  public?: boolean
}

const ok = (schema: z.ZodType, description = "OK") => ({ status: 200, schema, description })
const created = (schema: z.ZodType) => ({ status: 201, schema, description: "Created" })
const noContent = { status: 204, description: "No content" }

const endpoints: Endpoint[] = [
  // Auth
  {
    method: "post",
    path: "/auth/login",
    tag: "Auth",
    summary: "Sign in",
    public: true,
    body: loginSchema,
    response: noContent,
    errors: [400, 429],
    description:
      "Django session login. Sets the httpOnly session cookie and the csrftoken cookie. Use one generic error for wrong email or password.",
  },
  { method: "post", path: "/auth/logout", tag: "Auth", summary: "Sign out", response: noContent },
  {
    method: "get",
    path: "/me",
    tag: "Auth",
    summary: "Current user, organisation and entitlements",
    response: ok(sessionSchema),
  },

  // Home
  {
    method: "get",
    path: "/dashboard/summary",
    tag: "Home",
    summary: "Home dashboard in one call",
    response: ok(dashboardSummarySchema),
    description:
      "Aggregates KPIs, the action list, today's visits, pending assignments and weekly volunteer hours for the signed-in provider organisation.",
  },

  // Clients
  {
    method: "get",
    path: "/clients",
    tag: "Clients",
    summary: "Clients assigned to the organisation",
    response: ok(paginatedSchema(clientSchema)),
    query: [
      {
        name: "status",
        schema: programmeStatusSchema,
        description: "Programme status",
      },
      {
        name: "closed",
        schema: z.boolean(),
        description:
          "true returns only CLOSED and DECEASED records. Otherwise they are left out (deceased protocol).",
      },
      {
        name: "needs_response",
        schema: z.boolean(),
        description: "Only clients with an observation awaiting the provider",
      },
      { name: "area", schema: z.string(), description: "Postcode district, e.g. E6" },
      {
        name: "search",
        schema: z.string(),
        description: "Matches Buddii ID, postcode district or goal text",
      },
      { name: "page", schema: z.number().int().positive(), description: "DRF page number" },
    ],
  },
  {
    method: "get",
    path: "/clients/{id}",
    tag: "Clients",
    summary: "Client detail",
    response: ok(clientDetailSchema),
    errors: [404],
  },

  // Assignments
  {
    method: "get",
    path: "/assignments",
    tag: "Assignments",
    summary: "Council programme assignments",
    response: ok(assignmentListSchema),
    query: [
      {
        name: "status",
        schema: z.enum(["PENDING", "CONFIRMED", "DECLINED"]),
        description: "Defaults to PENDING",
      },
    ],
  },
  {
    method: "post",
    path: "/assignments/{id}/confirm",
    tag: "Assignments",
    summary: "Confirm programme participation",
    body: confirmAssignmentInputSchema,
    response: ok(assignmentSchema),
    errors: [403, 404, 409],
    capability: "assignments.respond",
  },
  {
    method: "post",
    path: "/assignments/{id}/decline",
    tag: "Assignments",
    summary: "Decline and return to the council",
    body: declineAssignmentInputSchema,
    response: ok(assignmentSchema),
    errors: [403, 404, 409],
    capability: "assignments.respond",
  },

  // Referrals
  {
    method: "get",
    path: "/referrals",
    tag: "Referrals",
    summary: "Referrals this provider has sent to the council, newest first",
    response: ok(referralListSchema),
  },
  {
    method: "post",
    path: "/referrals",
    tag: "Referrals",
    summary: "Refer a resident to the council",
    description:
      "The council reviews the referral and creates the client account. No name, address or clinical data is accepted.",
    body: newReferralSchema,
    response: created(referralSchema),
    errors: [400, 403],
    capability: "referrals.create",
  },

  // Support requests
  {
    method: "get",
    path: "/support-requests",
    tag: "Support requests",
    summary: "Support requests with per-status counts",
    response: ok(supportRequestListSchema),
    query: [
      {
        name: "status",
        schema: z.enum(REQUEST_STATUSES),
        description: "Filter by pipeline status",
      },
      { name: "client", schema: z.string(), description: "Buddii ID" },
    ],
  },
  {
    method: "post",
    path: "/support-requests",
    tag: "Support requests",
    summary: "Create a support request",
    body: newSupportRequestSchema,
    response: created(supportRequestSchema),
    errors: [400, 403, 409],
    capability: "requests.create",
  },
  {
    method: "post",
    path: "/support-requests/{id}/cancel",
    tag: "Support requests",
    summary: "Cancel before a volunteer is active",
    response: ok(supportRequestSchema),
    errors: [403, 404, 409],
    capability: "requests.cancel",
  },

  // Volunteer activity
  {
    method: "get",
    path: "/activity",
    tag: "Volunteer activity",
    summary: "Volunteer visits with counts and stats",
    response: ok(activityListSchema),
    query: [
      {
        name: "filter",
        schema: z.enum(["all", "today", "upcoming", "needs_response", "missed"]),
        description: "Defaults to all; 'today' uses the UK calendar day",
      },
      { name: "client", schema: z.string(), description: "Buddii ID" },
    ],
  },
  {
    method: "post",
    path: "/activity/{id}/response",
    tag: "Volunteer activity",
    summary: "Record the provider response to an observation",
    body: providerResponseInputSchema,
    response: ok(activityRecordSchema),
    errors: [400, 403, 404],
    capability: "activity.respond",
  },

  // Outcomes
  {
    method: "get",
    path: "/outcomes/summary",
    tag: "Outcomes",
    summary: "Programme outcomes for the organisation",
    response: ok(outcomesSummarySchema),
  },

  // Messages
  {
    method: "get",
    path: "/messages/threads",
    tag: "Messages",
    summary: "Audited coordinator threads",
    response: ok(z.array(threadSchema)),
  },
  {
    method: "post",
    path: "/messages/threads/{id}/messages",
    tag: "Messages",
    summary: "Send a message",
    body: newMessageSchema,
    response: created(messageSchema),
    errors: [400, 403, 404],
    capability: "messages.send",
  },
  {
    method: "post",
    path: "/messages/threads/{id}/read",
    tag: "Messages",
    summary: "Mark a thread as read",
    response: noContent,
  },

  // Safeguarding
  {
    method: "get",
    path: "/safeguarding/concerns",
    tag: "Safeguarding",
    summary: "Concerns raised by the organisation",
    response: ok(z.array(concernSchema)),
  },
  {
    method: "post",
    path: "/safeguarding/concerns",
    tag: "Safeguarding",
    summary: "Report a concern",
    body: newConcernSchema,
    response: created(concernSchema),
    errors: [400, 403],
    capability: "safeguarding.report",
  },

  // Notifications
  {
    method: "get",
    path: "/notifications",
    tag: "Notifications",
    summary: "In-app notifications for the user",
    response: ok(z.array(notificationSchema)),
  },
  {
    method: "post",
    path: "/notifications/read-all",
    tag: "Notifications",
    summary: "Mark all as read",
    response: noContent,
  },

  // Reports
  {
    method: "get",
    path: "/reports",
    tag: "Reports",
    summary: "Available standard reports",
    response: ok(z.array(reportSchema)),
  },
  {
    method: "post",
    path: "/reports/{id}/generate",
    tag: "Reports",
    summary: "Generate a report",
    capability: "reports.generate",
    body: z.object({ period: z.enum(REPORT_PERIODS), format: z.enum(["PDF", "CSV"]) }),
    response: ok(reportSchema),
    errors: [403, 404],
    description: "The safeguarding summary additionally requires reports.safeguarding.",
  },

  // Users and settings
  {
    method: "get",
    path: "/users",
    tag: "Settings",
    summary: "Provider users",
    response: ok(z.array(providerUserSchema)),
  },
  {
    method: "post",
    path: "/users/invite",
    tag: "Settings",
    summary: "Invite a user",
    body: inviteUserSchema,
    response: created(providerUserSchema),
    errors: [400, 403],
    capability: "users.manage",
  },
  {
    method: "get",
    path: "/settings/organisation",
    tag: "Settings",
    summary: "Organisation profile (council managed)",
    response: ok(organisationSchema),
  },
  {
    method: "get",
    path: "/settings/notifications",
    tag: "Settings",
    summary: "Notification preferences",
    response: ok(notificationSettingsSchema),
  },
  {
    method: "put",
    path: "/settings/notifications",
    tag: "Settings",
    summary: "Save notification preferences",
    body: notificationSettingsSchema,
    response: ok(notificationSettingsSchema),
    errors: [400],
  },
]

const ERROR_DESCRIPTIONS: Record<number, string> = {
  400: "Validation error: `{ field: [message] }` or `{ detail }`",
  401: "Not signed in or session expired",
  403: "Role, organisation scope or entitlement does not allow this",
  404: "Not found, or not visible to this organisation",
  409: "State conflict (e.g. already answered)",
  429: "Rate limited",
}

const errorSchema = {
  type: "object",
  properties: { detail: { type: "string" } },
  additionalProperties: true,
}
const json = (schema: z.ZodType, io: "input" | "output") => ({
  "application/json": { schema: z.toJSONSchema(schema, { io, unrepresentable: "any" }) },
})

const paths: Record<string, Record<string, unknown>> = {}
for (const e of endpoints) {
  const pathParams = [...e.path.matchAll(/\{(\w+)\}/g)].map((m) => ({
    name: m[1],
    in: "path",
    required: true,
    schema: { type: "string" },
  }))
  const responses: Record<string, unknown> = {}
  if (e.response) {
    responses[e.response.status] = {
      description: e.response.description,
      ...(e.response.schema && { content: json(e.response.schema, "output") }),
    }
  }
  for (const status of [...(e.public ? [] : [401]), ...(e.errors ?? [])]) {
    responses[status] = {
      description: ERROR_DESCRIPTIONS[status],
      content: { "application/json": { schema: errorSchema } },
    }
  }
  paths[e.path] ??= {}
  paths[e.path]![e.method] = {
    tags: [e.tag],
    summary: e.summary,
    ...((e.description || e.capability) && {
      description: [e.description, e.capability && `Requires capability \`${e.capability}\`.`]
        .filter(Boolean)
        .join("\n\n"),
    }),
    ...(e.capability && { "x-capability": e.capability }),
    ...(e.public && { security: [] }),
    parameters: [
      ...pathParams,
      ...(e.query ?? []).map((q) => ({
        name: q.name,
        in: "query",
        required: false,
        description: q.description,
        schema: z.toJSONSchema(q.schema),
      })),
    ],
    ...(e.body && { requestBody: { required: true, content: json(e.body, "input") } }),
    responses,
  }
}

const document = {
  openapi: "3.1.0",
  info: {
    title: "Buddii Provider Portal API",
    version: "0.1.0",
    description:
      "Contract between the Provider Portal frontend and the Django/DRF API, generated from the frontend's zod schemas (`npm run openapi`). See docs/BACKEND_INTEGRATION.md for auth, scoping, data restrictions and error rules.",
  },
  servers: [{ url: "/api/v1", description: "Relative to the portal; set NEXT_PUBLIC_API_URL" }],
  security: [{ sessionCookie: [] }],
  components: {
    securitySchemes: {
      sessionCookie: { type: "apiKey", in: "cookie", name: "sessionid" },
      csrfToken: { type: "apiKey", in: "header", name: "X-CSRFToken" },
    },
  },
  paths,
}

const out = path.resolve(import.meta.dirname, "../docs/api/openapi.json")
mkdirSync(path.dirname(out), { recursive: true })
writeFileSync(out, `${JSON.stringify(document, null, 2)}\n`)
console.log(`Wrote ${endpoints.length} operations to ${path.relative(process.cwd(), out)}`)
