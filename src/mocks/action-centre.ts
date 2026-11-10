import { addDays, isBefore, parseISO } from "date-fns"

import { type Action, type ActionReplyInput } from "@/features/action-centre/schemas"
import { ASSESSMENT_KIND_LABEL } from "@/features/resident-records/schemas"

import { db, nowIso, todayIso } from "./db"
import { outcomeAssessmentsFixture } from "./fixtures/outcome-assessments"

type Reply = NonNullable<Action["reply"]>

const residentName = (id: string) => db.residents.find((r) => r.id === id)?.name ?? id
const residentHref = (id: string, tab?: string) =>
  `/residents/${encodeURIComponent(id)}${tab ? `?tab=${tab}` : ""}`

/**
 * Builds the Action Centre from the records it points at, so the list always matches its
 * sources (the Council rule: every action has a source and deep-links to it).
 */
export function buildActions(): Action[] {
  const today = todayIso()
  const soon = addDays(parseISO(today), 30)
  const actions: Omit<Action, "status" | "reply">[] = []

  for (const r of db.referrals.filter((r) => r.stage === "INFO_REQUESTED")) {
    actions.push({
      id: `ACT-${r.id}`,
      kind: "INFO_REQUEST",
      priority: "HIGH",
      title: "Council asked for more information on a referral",
      detail:
        r.councilNote ?? "The Council needs more information before it can recommend support.",
      residentId: null,
      residentName: r.residentName,
      sourceRef: r.id,
      href: "/assignments",
      raisedAt: r.submittedAt.slice(0, 10),
      dueAt: null,
      raisedBy: "James Robinson (LB Bromley)",
      canReply: true,
    })
  }

  for (const a of db.assessments.filter((a) => a.status === "INFO_REQUESTED")) {
    actions.push({
      id: `ACT-${a.id}`,
      kind: "INFO_REQUEST",
      priority: "HIGH",
      title: `Council asked to update the ${ASSESSMENT_KIND_LABEL[a.kind].toLowerCase()}`,
      detail: a.councilNote ?? "The Council needs more information on this assessment.",
      residentId: a.residentId,
      residentName: residentName(a.residentId),
      sourceRef: a.id,
      href: residentHref(a.residentId, "assessments"),
      raisedAt: a.submittedAt.slice(0, 10),
      dueAt: null,
      raisedBy: "James Robinson (LB Bromley)",
      canReply: true,
    })
  }

  for (const d of db.documents.filter((d) => d.status === "INFO_REQUESTED")) {
    actions.push({
      id: `ACT-${d.id}`,
      kind: "INFO_REQUEST",
      priority: "HIGH",
      title: `Council asked for a new ${d.type.toLowerCase()}`,
      detail: `${d.name} (v${d.version}) could not be verified. Upload a current version.`,
      residentId: d.residentId,
      residentName: residentName(d.residentId),
      sourceRef: d.id,
      href: residentHref(d.residentId, "documents"),
      raisedAt: d.uploadedAt,
      dueAt: null,
      raisedBy: "James Robinson (LB Bromley)",
      canReply: true,
    })
  }

  for (const a of db.assignments.filter((a) => a.status === "PENDING")) {
    actions.push({
      id: `ACT-${a.id}`,
      kind: "ASSIGNMENT",
      priority: "MEDIUM",
      title: "Confirm or decline a new assignment",
      detail: a.context,
      residentId: null,
      residentName: a.residentName,
      sourceRef: a.id,
      href: "/assignments",
      raisedAt: a.receivedAt,
      dueAt: null,
      raisedBy: "LB Bromley",
      canReply: false,
    })
  }

  for (const r of outcomeAssessmentsFixture.residents) {
    if (!r.nextReviewDue) continue
    const due = parseISO(r.nextReviewDue)
    const overdue = isBefore(due, parseISO(today))
    if (!overdue && isBefore(soon, due)) continue
    // A review already sent is waiting on the Council, not on the provider.
    const sent = db.assessments.some(
      (a) => a.residentId === r.residentId && a.submittedAt.slice(0, 10) >= r.nextReviewDue!,
    )
    if (sent) continue
    actions.push({
      id: `ACT-REVIEW-${r.residentId}`,
      kind: "REVIEW_DUE",
      priority: overdue ? "HIGH" : "LOW",
      title: overdue ? "Wellbeing review is overdue" : "Wellbeing review is due soon",
      detail: `The next wellbeing review for ${r.name} was due ${r.nextReviewDue}. Complete the review assessment and send it to the Council.`,
      residentId: r.residentId,
      residentName: r.name,
      sourceRef: r.residentId,
      href: residentHref(r.residentId, "assessments"),
      raisedAt: r.lastVerifiedAt ?? today,
      dueAt: r.nextReviewDue,
      raisedBy: "Review schedule",
      canReply: false,
    })
  }

  for (const v of db.activity.filter((v) => v.needsResponse && !v.providerResponse)) {
    actions.push({
      id: `ACT-${v.id}`,
      kind: "OBSERVATION",
      priority: "MEDIUM",
      title: "Respond to a volunteer observation",
      detail: v.observation ?? "The volunteer recorded an observation after the visit.",
      residentId: v.residentId,
      residentName: residentName(v.residentId),
      sourceRef: v.id,
      href: residentHref(v.residentId, "observations"),
      raisedAt: v.scheduledAt.slice(0, 10),
      dueAt: null,
      raisedBy: v.volunteerRef,
      canReply: false,
    })
  }

  const order = { HIGH: 0, MEDIUM: 1, LOW: 2 }
  return actions
    .map((a) => {
      const reply = db.actionReplies[a.id] ?? null
      return { ...a, reply, status: reply ? ("REPLIED" as const) : ("OPEN" as const) }
    })
    .sort(
      (a, b) =>
        Number(a.status === "REPLIED") - Number(b.status === "REPLIED") ||
        order[a.priority] - order[b.priority] ||
        b.raisedAt.localeCompare(a.raisedAt),
    )
}

export function replyToAction(action: Action, input: ActionReplyInput, by: string) {
  const reply: Reply = { message: input.message, files: input.files, at: nowIso(), by }
  db.actionReplies[action.id] = reply
  return reply
}
