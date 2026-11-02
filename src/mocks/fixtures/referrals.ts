import { type Referral } from "@/features/referrals/schemas"

/** Referrals this provider has sent to the council. No names or identifying details. */
export const referralsFixture: Referral[] = [
  {
    id: "REF-2026-014",
    providerRef: "NCH-4471",
    ageBand: "80-84",
    postcodeDistrict: "E13",
    supportTypes: ["Companionship visit", "Telephone check-in"],
    status: "UNDER_REVIEW",
    submittedAt: "2026-10-16",
    clientId: null,
    councilNote: null,
  },
  {
    id: "REF-2026-011",
    providerRef: "NCH-4402",
    ageBand: "75-79",
    postcodeDistrict: "E6",
    supportTypes: ["Shopping support", "Digital help"],
    status: "APPROVED",
    submittedAt: "2026-09-22",
    clientId: "BUD-0062",
    councilNote: "Approved. Resident record created.",
  },
  {
    id: "REF-2026-008",
    providerRef: "NCH-4310",
    ageBand: "85-89",
    postcodeDistrict: "E12",
    supportTypes: ["Appointment accompaniment"],
    status: "DECLINED",
    submittedAt: "2026-09-04",
    clientId: null,
    councilNote: "Already supported by another local scheme.",
  },
]
