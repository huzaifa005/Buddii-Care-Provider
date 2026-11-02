import { z } from "zod"

/**
 * Client records as the free Provider Portal may see them.
 *
 * Deliberately excluded (Care Buddii Pro / restricted data): medication, MAR, care plans,
 * MCA status, keysafe codes, DNR/DNAR, GPS/EVV, diagnoses, names and addresses.
 * `z.object` strips unknown keys, so if the API ever over-shares, those fields are
 * dropped before they reach a component. Do not switch these to `z.looseObject`.
 */

export const buddiiIdSchema = z.string().regex(/^BUD-\d{4,}$/, "Invalid Buddii ID")

/**
 * DECEASED follows the deceased client protocol: the record is locked, alerts stop and the
 * client is left out of monitoring views. The status value is pending client sign-off (Q4).
 */
export const programmeStatusSchema = z.enum(["ACTIVE", "PENDING", "PAUSED", "CLOSED", "DECEASED"])
export type ProgrammeStatus = z.infer<typeof programmeStatusSchema>

export const volunteerMatchStatusSchema = z.enum(["MATCHED", "AWAITING_MATCH"])
export type VolunteerMatchStatus = z.infer<typeof volunteerMatchStatusSchema>

export const consentStatusSchema = z.enum(["GIVEN", "PENDING", "WITHDRAWN"])
export type ConsentStatus = z.infer<typeof consentStatusSchema>

/** Volunteer-observed score on the Buddii outcome framework, not a clinical assessment. */
export const outcomeScoreSchema = z.number().int().min(1).max(5)

const activityRefSchema = z.object({
  date: z.iso.date(),
  type: z.string(),
  volunteerRef: z.string(),
})

export const clientSchema = z.object({
  id: buddiiIdSchema,
  ageBand: z.string(),
  postcodeDistrict: z.string(),
  programmeStatus: programmeStatusSchema,
  volunteerMatchStatus: volunteerMatchStatusSchema,
  consentStatus: consentStatusSchema,
  coordinatorRef: z.string(),
  supportGoals: z.array(z.string()),
  wellbeingHistory: z.array(outcomeScoreSchema),
  lonelinessHistory: z.array(outcomeScoreSchema),
  confidenceHistory: z.array(outcomeScoreSchema),
  lastActivity: activityRefSchema.nullable(),
  nextActivity: activityRefSchema.nullable(),
  needsProviderResponse: z.boolean(),
})

export type Client = z.infer<typeof clientSchema>

/** Everything the client detail page shows, in one call. */
export const clientDetailSchema = clientSchema.extend({
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
export type ClientDetail = z.infer<typeof clientDetailSchema>

export const clientListFiltersSchema = z.object({
  status: programmeStatusSchema.optional(),
  needsResponse: z.boolean().optional(),
  /** Closed and deceased records. Every other view leaves them out. */
  closed: z.boolean().optional(),
  /** Postcode district, e.g. E6. */
  area: z.string().optional(),
  search: z.string().optional(),
  page: z.number().int().positive().optional(),
})

export type ClientListFilters = z.infer<typeof clientListFiltersSchema>
