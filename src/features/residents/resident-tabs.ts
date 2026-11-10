/** Tabs of the resident profile, in the order the v10 design lists them (`?tab=`). */
export const RESIDENT_TABS = [
  "overview",
  "plan",
  "activity",
  "outcomes",
  "assessments",
  "documents",
  "observations",
  "consent",
  "history",
] as const
export type ResidentTab = (typeof RESIDENT_TABS)[number]
