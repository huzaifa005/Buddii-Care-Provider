import { z } from "zod"

/**
 * Resident records as the free Provider Portal may see them.
 *
 * Deliberately excluded (Care Buddii Pro / restricted data): medication, MAR, care plans,
 * MCA status, keysafe codes, DNR/DNAR, GPS/EVV, diagnoses and full addresses. The resident's
 * name is shared so staff recognise who they support (same as the Council Dashboard).
 * `z.object` strips unknown keys, so if the API ever over-shares, those fields are
 * dropped before they reach a component. Do not switch these to `z.looseObject`.
 */

export const buddiiIdSchema = z.string().regex(/^BUD-\d{4,}$/, "Invalid Buddii ID")

/**
 * DECEASED follows the deceased resident protocol: the record is locked, alerts stop and the
 * resident is left out of monitoring views. The status value is pending client sign-off (Q4).
 */
export const programmeStatusSchema = z.enum(["ACTIVE", "PENDING", "PAUSED", "CLOSED", "DECEASED"])
export type ProgrammeStatus = z.infer<typeof programmeStatusSchema>

export const volunteerMatchStatusSchema = z.enum(["MATCHED", "AWAITING_MATCH"])
export type VolunteerMatchStatus = z.infer<typeof volunteerMatchStatusSchema>

export const consentStatusSchema = z.enum(["GIVEN", "PENDING", "WITHDRAWN"])
export type ConsentStatus = z.infer<typeof consentStatusSchema>

/** Volunteer visit check after each visit (1-5). Not an assessment score. */
export const outcomeScoreSchema = z.number().int().min(1).max(5)

const activityRefSchema = z.object({
  date: z.iso.date(),
  type: z.string(),
  volunteerRef: z.string(),
})

/** LB Bromley areas, as the Council Dashboard uses them. */
export const BROMLEY_AREAS = [
  "Bromley Central",
  "Orpington",
  "Beckenham",
  "Sidcup",
  "Chislehurst",
  "West Wickham",
] as const

/** The Council resident journey (CLAUDE.md rule 3). Recommendation is not consent. */
export const JOURNEY_STAGES = [
  "Imported",
  "Info requested",
  "Info checked",
  "Recommended",
  "Approved",
  "Consent",
  "Support active",
  "Outcomes review",
] as const
export type JourneyStage = (typeof JOURNEY_STAGES)[number]

export const residentSchema = z.object({
  id: buddiiIdSchema,
  name: z.string().min(1),
  ageBand: z.string(),
  area: z.enum(BROMLEY_AREAS),
  /** Outward code only, e.g. BR1. */
  postcodeDistrict: z.string(),
  programmeStatus: programmeStatusSchema,
  volunteerMatchStatus: volunteerMatchStatusSchema,
  consentStatus: consentStatusSchema,
  coordinatorRef: z.string(),
  supportGoals: z.array(z.string()),
  /** Volunteer visit checks (1-5), oldest first. Not an assessment score. */
  visitCheckHistory: z.array(outcomeScoreSchema),
  lastActivity: activityRefSchema.nullable(),
  nextActivity: activityRefSchema.nullable(),
  needsProviderResponse: z.boolean(),
  /** Current Council journey stage, with the date each stage was reached (null = not yet). */
  journey: z.object({
    stage: z.enum(JOURNEY_STAGES),
    dates: z.array(z.iso.date().nullable()).length(JOURNEY_STAGES.length),
  }),
})

export type Resident = z.infer<typeof residentSchema>

/** Everything the client detail page shows, in one call. */
export const residentDetailSchema = residentSchema.extend({
  permittedActivities: z.array(z.string()),
  consent: z.object({
    status: consentStatusSchema,
    lawfulBasis: z.string(),
    recordedAt: z.iso.date().nullable(),
    recordedBy: z.string().nullable(),
  }),
  history: z.array(
    z.object({
      id: z.string(),
      at: z.iso.datetime({ offset: true }),
      event: z.string(),
      actor: z.string(),
      kind: z.enum(["ASSIGNMENT", "REQUEST", "ACTIVITY", "CONSENT", "SAFEGUARDING", "STATUS"]),
    }),
  ),
})
export type ResidentDetail = z.infer<typeof residentDetailSchema>

export const residentListFiltersSchema = z.object({
  status: programmeStatusSchema.optional(),
  needsResponse: z.boolean().optional(),
  /** Waiting for the coordinator to match a volunteer. */
  awaitingMatch: z.boolean().optional(),
  /** Closed and deceased records. Every other view leaves them out. */
  closed: z.boolean().optional(),
  /** Bromley area, e.g. Orpington. */
  area: z.string().optional(),
  search: z.string().optional(),
  page: z.number().int().positive().optional(),
})

export type ResidentListFilters = z.infer<typeof residentListFiltersSchema>

/** Name lookup for every resident of this provider, closed records included. */
export const residentDirectorySchema = z.array(z.object({ id: buddiiIdSchema, name: z.string() }))
export type ResidentDirectory = z.infer<typeof residentDirectorySchema>
