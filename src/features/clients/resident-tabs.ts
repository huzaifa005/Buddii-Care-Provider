/** Tabs of the resident profile, in the order the v10 design lists them (`?tab=`). */
export const CLIENT_TABS = [
  "overview",
  "plan",
  "activity",
  "outcomes",
  "observations",
  "consent",
  "history",
] as const
export type ClientTab = (typeof CLIENT_TABS)[number]
