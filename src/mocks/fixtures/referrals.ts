import { type Referral } from "@/features/referrals/schemas"

/** Residents Bromley Care Services has sent to LB Bromley Council (Council dummy data). */
export const referralsFixture: Referral[] = [
  {
    id: "REF-2026-014",
    residentName: "Diana Carter",
    postcode: "BR6 0LS",
    stage: "INFO_REQUESTED",
    submittedAt: "2026-10-28",
    documents: [{ name: "Diana_Carter_consent.pdf", size: 184_320, type: "Consent form" }],
    reviewFlags: 1,
    residentId: null,
    councilNote: "Please upload the current care plan so we can check the information.",
  },
  {
    id: "REF-2026-011",
    residentName: "Arthur Miller",
    postcode: "BR3 4AL",
    stage: "APPROVED",
    submittedAt: "2026-10-09",
    documents: [
      { name: "Arthur_Miller_care_plan.pdf", size: 412_672, type: "Care or support plan" },
      { name: "Arthur_Miller_consent.pdf", size: 152_004, type: "Consent form" },
    ],
    reviewFlags: 0,
    residentId: "BUD-0062",
    councilNote: "Approved. Resident record created.",
  },
  {
    id: "REF-2026-008",
    residentName: "Frank Thompson",
    postcode: "BR7 5DX",
    stage: "NOT_ACCEPTED",
    submittedAt: "2026-09-22",
    documents: [],
    reviewFlags: 2,
    residentId: null,
    councilNote: "Personal care need (E1). Referred for a Care Act needs assessment instead.",
  },
]
