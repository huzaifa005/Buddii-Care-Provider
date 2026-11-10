import { type OutcomesAssessments } from "@/features/outcomes/schemas"

/**
 * Council-verified WEMWBS (14-70) and UCLA 3-item (3-9) scores for Bromley Care Services.
 * `latest` is null until a review has been verified. Closed and deceased records are left out.
 */
export const outcomeAssessmentsFixture: OutcomesAssessments = {
  asOf: "2026-10-30",
  residents: [
    {
      residentId: "BUD-0009",
      name: "Margaret Davies",
      area: "Bromley Central",
      wemwbs: { baseline: 42, latest: 51 },
      ucla: { baseline: 8, latest: 6 },
      visitCheck: { baseline: 2, latest: 4 },
      lastVerifiedAt: "2026-10-14",
      nextReviewDue: "2027-01-14",
    },
    {
      residentId: "BUD-0018",
      name: "Harold Bennett",
      area: "West Wickham",
      wemwbs: { baseline: 45, latest: 49 },
      ucla: { baseline: 7, latest: 6 },
      visitCheck: { baseline: 3, latest: 5 },
      lastVerifiedAt: "2026-10-02",
      nextReviewDue: "2027-01-02",
    },
    {
      residentId: "BUD-0031",
      name: "Edith Clarke",
      area: "Chislehurst",
      wemwbs: { baseline: 38, latest: 38 },
      ucla: { baseline: 8, latest: 8 },
      visitCheck: { baseline: 3, latest: 3 },
      lastVerifiedAt: "2026-08-21",
      nextReviewDue: "2026-11-21",
    },
    {
      residentId: "BUD-0033",
      name: "Joan Whitfield",
      area: "Beckenham",
      wemwbs: { baseline: 44, latest: null },
      ucla: { baseline: 7, latest: null },
      visitCheck: { baseline: 3, latest: 3 },
      lastVerifiedAt: "2026-07-14",
      nextReviewDue: "2026-10-14",
    },
    {
      residentId: "BUD-0062",
      name: "Arthur Miller",
      area: "Orpington",
      wemwbs: { baseline: 40, latest: 46 },
      ucla: { baseline: 9, latest: 7 },
      visitCheck: { baseline: 2, latest: 4 },
      lastVerifiedAt: "2026-10-30",
      nextReviewDue: "2027-01-30",
    },
    {
      residentId: "BUD-0044",
      name: "Peter Hughes",
      area: "Bromley Central",
      wemwbs: { baseline: null, latest: null },
      ucla: { baseline: null, latest: null },
      visitCheck: { baseline: null, latest: null },
      lastVerifiedAt: null,
      nextReviewDue: null,
    },
  ],
}
