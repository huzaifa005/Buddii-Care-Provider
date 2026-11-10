"use client"

import { useParams } from "next/navigation"
import { parseAsStringLiteral, useQueryState } from "nuqs"

import { WellbeingAssessmentForm } from "@/features/referrals/components/refer-resident-form"

import { ASSESSMENT_KINDS } from "../schemas"

/** Baseline or review assessment for an existing resident (`?kind=REVIEW_3M`). */
export function NewAssessmentView() {
  const { residentId } = useParams<{ residentId: string }>()
  const [kind] = useQueryState(
    "kind",
    parseAsStringLiteral(ASSESSMENT_KINDS).withDefault("BASELINE"),
  )
  return <WellbeingAssessmentForm key={kind} mode={{ type: "assessment", residentId, kind }} />
}
