import { z } from "zod"

/**
 * Buddii Wellbeing Assessment Form, revised draft v0.2 (client document). Question wording and
 * answer options are copied from the form. Scores are for the assessment tool and the Council
 * reviewer only, so the provider never sees them; the backend calculates them on submission.
 */

export const NOT_KNOWN = "Not known"

export interface Question {
  id: string
  label: string
  options: readonly string[]
  multiple?: boolean
  /** Free-text box shown when "Other" is chosen. */
  other?: boolean
}

export interface ScaleRow {
  id: string
  label: string
}

export interface AssessmentSection {
  id: string
  letter: string
  title: string
  intro?: string
  questions?: Question[]
  scale?: { columns: readonly string[]; rows: ScaleRow[] }
  /** Free-text prompts (id → label). */
  notes?: { id: string; label: string }[]
}

const DAILY_SCALE = [
  "Manages independently",
  "Some difficulty",
  "Needs regular help",
  "Cannot manage without help",
  NOT_KNOWN,
] as const

export const SECTIONS: AssessmentSection[] = [
  {
    id: "consent",
    letter: "A",
    title: "Consent and privacy",
    intro: "Complete first. No further information is collected until A1 to A4 are answered.",
    questions: [
      {
        id: "A1",
        label:
          "Has the person been told why this information is being collected and how Buddii will use it?",
        options: ["Yes", "No", "Unable to confirm"],
      },
      {
        id: "A2",
        label: "Has the Buddii privacy notice been given or explained?",
        options: ["Yes, copy given", "Yes, explained verbally", "No"],
      },
      {
        id: "A3",
        label:
          "Does the person agree to Buddii collecting this information and contacting them about support?",
        options: ["Yes", "No", "Decision pending"],
      },
      {
        id: "A4",
        label:
          "Is there any reason to doubt the person can understand and agree to this themselves?",
        options: [
          "No",
          "Yes, someone holds a Lasting Power of Attorney (health and welfare) or a deputyship",
          "Yes, no one holds legal authority",
          NOT_KNOWN,
        ],
      },
    ],
    notes: [
      {
        id: "A4_authority",
        label:
          "If someone holds legal authority, their name and confirmation the document has been seen",
      },
    ],
  },
  {
    id: "person",
    letter: "B",
    title: "About the person",
    questions: [
      {
        id: "B1",
        label: "Living arrangement",
        options: [
          "Alone",
          "With partner",
          "With family",
          "Supported or sheltered housing",
          "Care home",
          "Other",
        ],
        other: true,
      },
      {
        id: "B3",
        label: "Whose answers does this form record?",
        options: [
          "The person's own answers",
          "Partly the person's own answers",
          "Someone else's view only",
        ],
      },
    ],
  },
  {
    id: "reason",
    letter: "C",
    title: "Reason for referral",
    questions: [
      {
        id: "C1",
        label: "Why is support being considered?",
        multiple: true,
        options: [
          "Loneliness or isolation",
          "Loss of confidence or independence",
          "Recent bereavement",
          "Other recent change (moving home, loss of a carer)",
          "After a hospital stay",
          "Concern from family or a carer",
          "Other",
        ],
        other: true,
      },
      {
        id: "C2",
        label: "How soon is support needed?",
        options: ["Within 2 weeks", "Within a month", "No urgency, preventative", NOT_KNOWN],
      },
    ],
    notes: [{ id: "C_main", label: "Main concern in a sentence or two" }],
  },
  {
    id: "safety",
    letter: "D",
    title: "Safety screen",
    intro:
      "If any answer needs action, the assessment stops and no plan is drafted until the concern has been dealt with.",
    questions: [
      {
        id: "D1",
        label: "Does the person feel safe at home and when out?",
        options: ["Yes", "Sometimes", "No", NOT_KNOWN],
      },
      {
        id: "D2",
        label:
          "Is there any concern about abuse, neglect, exploitation (including financial) or self-neglect?",
        options: ["No", "Yes", "Unsure"],
      },
      {
        id: "D3",
        label: "Is the person without enough food, heating, safe housing or other essentials?",
        options: ["No", "Yes", "Unsure"],
      },
      {
        id: "D4",
        label: "Is there a health or safety concern that needs a professional soon?",
        options: ["No", "Yes", "Unsure"],
      },
    ],
    notes: [
      {
        id: "D_action",
        label: "Action already taken, and by whom (keep sensitive detail to a minimum)",
      },
    ],
  },
  {
    id: "independence",
    letter: "E",
    title: "Everyday independence",
    scale: {
      columns: DAILY_SCALE,
      rows: [
        { id: "E1", label: "Washing, dressing and personal routines" },
        { id: "E2", label: "Preparing meals" },
        { id: "E3", label: "Shopping and household tasks" },
        { id: "E4", label: "Getting to appointments and running errands" },
      ],
    },
    questions: [
      {
        id: "E5",
        label: "How confident does the person feel living in their home?",
        options: [
          "Very confident",
          "Fairly confident",
          "Not very confident",
          "Not at all confident",
          NOT_KNOWN,
        ],
      },
    ],
    notes: [{ id: "E_tasks", label: "Everyday tasks where a volunteer could help" }],
  },
  {
    id: "mobility",
    letter: "F",
    title: "Getting around and physical wellbeing",
    scale: {
      columns: DAILY_SCALE,
      rows: [
        { id: "F1", label: "Moving around at home" },
        { id: "F2", label: "Going outside and travelling locally" },
      ],
    },
    questions: [
      {
        id: "F3",
        label: "Falls or near-falls in the last 12 months",
        options: ["None", "One", "More than one", NOT_KNOWN],
      },
      {
        id: "F4",
        label: "How much do pain, tiredness, hearing or sight affect everyday life?",
        options: ["Not at all", "A little", "Quite a lot", "Significantly", NOT_KNOWN],
      },
      {
        id: "F5",
        label: "Mobility aids used",
        multiple: true,
        options: [
          "None",
          "Walking stick",
          "Frame",
          "Wheelchair",
          "Mobility scooter",
          "Hearing aid",
          "Other",
        ],
        other: true,
      },
    ],
  },
  {
    id: "loneliness",
    letter: "G",
    title: "Loneliness and emotional wellbeing",
    intro:
      "G1 to G4 are the baseline outcome measures, asked again at the 3-month and 6-month reviews. Use the person's own words where possible.",
    questions: [
      {
        id: "G1",
        label: "How often do you feel lonely?",
        options: [
          "Often or always",
          "Some of the time",
          "Occasionally",
          "Hardly ever",
          "Never",
          "Prefer not to say",
        ],
      },
    ],
    scale: {
      columns: ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"],
      rows: [
        { id: "G2", label: "I am content with my friendships and relationships" },
        { id: "G3", label: "I have enough people I feel comfortable asking for help at any time" },
        { id: "G4", label: "My relationships are as satisfying as I would want them to be" },
      ],
    },
    notes: [{ id: "G_mood", label: "What tends to lift the person's mood, or bring it down?" }],
  },
  {
    id: "emotional",
    letter: "G",
    title: "Emotional wellbeing",
    questions: [
      {
        id: "G5",
        label: "How often does the person feel low, worried or anxious?",
        options: ["Never", "Occasionally", "Often", "Most days", NOT_KNOWN],
      },
      {
        id: "G6",
        label: "How often does the person feel like doing things they enjoy?",
        options: ["Usually", "Sometimes", "Rarely", "Never", NOT_KNOWN],
      },
      {
        id: "G7",
        label: "How would the person describe their overall wellbeing?",
        options: ["Very good", "Good", "Fair", "Poor", "Very poor", NOT_KNOWN],
      },
    ],
  },
  {
    id: "social",
    letter: "H",
    title: "Social contact and community",
    questions: [
      {
        id: "H1",
        label: "How often does the person have meaningful contact with friends or family?",
        options: [
          "Daily",
          "Several times a week",
          "About once a week",
          "Less than once a week",
          "Never or almost never",
          NOT_KNOWN,
        ],
      },
      {
        id: "H2",
        label: "How often does the person go to groups, faith or community activities?",
        options: ["Regularly", "Sometimes", "Rarely", "Never", NOT_KNOWN],
      },
      {
        id: "H3",
        label: "Would the person like more company?",
        options: ["Yes", "Unsure", "No", NOT_KNOWN],
      },
      {
        id: "H4",
        label: "What stops the person taking part more?",
        multiple: true,
        options: [
          "Transport",
          "Mobility",
          "Confidence",
          "Cost",
          "Nothing suitable nearby",
          "No one to go with",
          "No barriers",
          "Other",
        ],
        other: true,
      },
      {
        id: "H5",
        label: "Interests (used to match a volunteer)",
        multiple: true,
        options: [
          "Gardening",
          "Music",
          "Reading",
          "Arts and crafts",
          "Cooking and baking",
          "Sport (watching or playing)",
          "Walking and nature",
          "History and local heritage",
          "Films and TV",
          "Puzzles and games",
          "Faith or spiritual life",
          "Pets and animals",
          "Technology",
          "Travel and other cultures",
          "Other",
        ],
        other: true,
      },
    ],
    notes: [
      {
        id: "H_more",
        label: "Anything more about these interests, or groups the person enjoys or used to enjoy",
      },
    ],
  },
  {
    id: "memory",
    letter: "I",
    title: "Memory and communication",
    questions: [
      {
        id: "I1",
        label: "Does the person have difficulty remembering appointments or everyday routines?",
        options: ["No", "Occasionally", "Often", "Most of the time", NOT_KNOWN],
      },
      {
        id: "I2",
        label: "Does the person have difficulty communicating or understanding others?",
        options: ["No", "A little", "Quite a lot", "Significantly", NOT_KNOWN],
      },
      {
        id: "I3",
        label: "What helps communication?",
        multiple: true,
        options: [
          "Speaking slowly and clearly",
          "Face to face",
          "Written reminders",
          "Large print",
          "Hearing loop or a quiet room",
          "A family member present",
          "Other",
        ],
        other: true,
      },
    ],
  },
  {
    id: "support",
    letter: "J",
    title: "Current support",
    questions: [
      {
        id: "J1",
        label: "Who helps the person now?",
        multiple: true,
        options: [
          "Family or friends",
          "Unpaid carer",
          "Paid care workers",
          "Council services",
          "Other volunteers",
          "No one",
        ],
      },
      {
        id: "J2",
        label: "How often does the person get help?",
        options: ["Daily", "Several times a week", "Weekly", "Less often", "Never", NOT_KNOWN],
      },
      {
        id: "J3",
        label: "Does the person have a care or support plan from the council or a care provider?",
        options: ["Yes", "No", NOT_KNOWN],
      },
      {
        id: "J4",
        label: "Are any needs still unmet despite the help they get?",
        options: ["No", "Yes", "Unsure", NOT_KNOWN],
      },
    ],
    notes: [{ id: "J_unmet", label: "If yes, which needs?" }],
  },
  {
    id: "preferences",
    letter: "K",
    title: "Preferences, matching and visit safety",
    questions: [
      {
        id: "K1",
        label: "What support would the person welcome?",
        multiple: true,
        options: [
          "Home visits for company",
          "Phone check-ins",
          "Video calls",
          "Outings and days out",
          "Going with them to groups or activities",
          "Help with shopping or errands",
          "Help using a phone, tablet or computer",
          "Other",
        ],
        other: true,
      },
      {
        id: "K2",
        label: "Preferred times",
        multiple: true,
        options: [
          "Weekday mornings",
          "Weekday afternoons",
          "Weekday evenings",
          "Weekends",
          "Flexible",
        ],
      },
      {
        id: "K3",
        label: "Preferred visit frequency",
        options: ["Weekly", "Fortnightly", "Monthly", "Unsure"],
      },
      {
        id: "K4",
        label: "Volunteer preferences",
        multiple: true,
        options: [
          "No preference",
          "Prefers a woman",
          "Prefers a man",
          "Speaks a particular language",
          "Shares a faith or culture",
        ],
      },
      {
        id: "K5",
        label: "Digital access",
        multiple: true,
        options: ["Smartphone", "Tablet", "Computer", "Home internet", "None", NOT_KNOWN],
      },
      { id: "K6_pets", label: "Pets in the home?", options: ["No", "Yes"] },
      { id: "K6_smoke", label: "Does anyone smoke in the home?", options: ["No", "Yes"] },
      {
        id: "K6_access",
        label: "How does a visitor get in?",
        options: [
          "Person answers the door",
          "Key safe (code held by the coordinator only)",
          "Other",
        ],
        other: true,
      },
      {
        id: "K6_others",
        label: "Anyone else living in or regularly at the home?",
        options: ["No", "Yes"],
      },
      {
        id: "K6_risk",
        label: "Any known risks to a visitor (access, home environment, behaviour)?",
        options: ["No", "Yes"],
      },
    ],
    notes: [
      {
        id: "K_details",
        label: "Details for any Yes answer above (pets, others at home, known risks)",
      },
      { id: "K7", label: "What can the person do for themselves, and what matters most to them?" },
    ],
  },
  {
    id: "goals",
    letter: "L",
    title: "Goals",
    questions: [
      {
        id: "L1",
        label: "Which outcomes matter most? (up to two)",
        multiple: true,
        options: [
          "Feel less lonely",
          "Get out more",
          "Build confidence",
          "Stay independent",
          "Have a regular routine",
          "Give my carer a break",
          "Learn to use technology",
          "Other",
        ],
        other: true,
      },
    ],
    notes: [
      {
        id: "L_goal1",
        label: "Goal 1: in the person's own words, what would be different in three months?",
      },
      {
        id: "L_goal2",
        label: "Goal 2: in the person's own words, what would be different in three months?",
      },
      { id: "L_avoid", label: "Is there anything the person does not want, or wants to avoid?" },
    ],
  },
]

/** Section B identity details (sent to the Council, never to volunteers). */
export const personSchema = z.object({
  fullName: z.string().trim().min(2, "Enter the person's full name"),
  preferredName: z.string().trim().optional(),
  dateOfBirth: z.iso.date("Enter the date of birth"),
  address: z.string().trim().min(5, "Enter the address"),
  postcode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^BR\d{1,2}\s?\d[A-Z]{2}$/, "Enter a Bromley postcode, e.g. BR1 3AA"),
  telephone: z
    .string()
    .trim()
    .regex(/^\+44\s?\d[\d\s]{8,12}$/, "Enter the number in +44 format"),
  preferredLanguage: z.string().trim().optional(),
  interpreterNeeded: z.enum(["Yes", "No"]).optional(),
  emergencyContact: z.string().trim().optional(),
  gpSurgery: z.string().trim().optional(),
})
export type Person = z.infer<typeof personSchema>

/** Answers keyed by question id: one option, several options, or free text. */
export type Answers = Record<string, string | string[] | undefined>

export interface GateResult {
  kind: "stop" | "pause" | "review" | "flag"
  /** Question that triggers the rule; the rule is shown on that question's section. */
  on: string
  message: string
}

/**
 * The form's "What happens next" rules, in the order the scoring key checks them.
 * "stop" and "pause" block sending; "review" and "flag" are passed to the Council reviewer.
 */
export function evaluateRules(a: Answers): GateResult[] {
  const out: GateResult[] = []
  const is = (id: string, ...v: string[]) => v.includes(String(a[id] ?? ""))
  const has = (id: string, v: string) => Array.isArray(a[id]) && (a[id] as string[]).includes(v)
  const add = (kind: GateResult["kind"], on: string, message: string) =>
    out.push({ kind, on, message })

  // Section A
  if (is("A3", "No"))
    add("stop", "A3", "The person declined. Do not send; record that they declined.")
  if (is("A3", "Decision pending") || is("A1", "No") || is("A2", "No"))
    add("pause", "A1", "Send once the person has been given the information and has decided.")
  if (is("A4", "Yes, no one holds legal authority", NOT_KNOWN))
    add(
      "review",
      "A4",
      "An authorised reviewer decides whether to go ahead, in the person's best interests.",
    )

  // Section D
  if (is("D2", "Yes", "Unsure"))
    add(
      "stop",
      "D2",
      "Raise with the safeguarding lead today, for referral to the local authority safeguarding team.",
    )
  if (is("D3", "Yes") || is("D4", "Yes"))
    add("stop", "D3", "Signpost to the GP, NHS 111, the council or the relevant service first.")
  if (is("D3", "Unsure") || is("D4", "Unsure") || is("D1", "No"))
    add("review", "D1", "A reviewer calls before any plan is drafted.")
  if (is("D1", "Sometimes")) add("flag", "D1", "Considered when matching a volunteer.")

  // Sections E, F
  if (is("E1", "Needs regular help", "Cannot manage without help"))
    add(
      "review",
      "E1",
      "A personal care need. Volunteers cannot meet it; Care Act assessment or a regulated provider.",
    )
  if (is("E2", "Cannot manage without help") && has("J1", "No one"))
    add("review", "E2", "Check basic needs are met before planning companionship.")
  if (
    is("F3", "More than one") ||
    is("F1", "Cannot manage without help") ||
    is("F2", "Cannot manage without help")
  )
    add("review", "F3", "Consider a falls referral; outings only once agreed safe.")

  // Sections G, H, I, K
  if (is("G5", "Most days") || is("G7", "Very poor"))
    add(
      "review",
      "G5",
      "The reviewer suggests the GP or NHS Talking Therapies. Companionship can go ahead alongside.",
    )
  if (is("H3", "No")) add("review", "H3", "Check the person wants Buddii before any match.")
  if (is("I1", "Often", "Most of the time"))
    add(
      "flag",
      "I1",
      "Match a volunteer with dementia awareness training; phone reminders before visits.",
    )
  if (is("I1", "Most of the time") && is("B1", "Alone"))
    add("review", "I1", "Lives alone: consider whether care or council support is also needed.")
  if (is("K6_risk", "Yes"))
    add(
      "review",
      "K6_risk",
      "The coordinator completes a lone-working risk check before any home visit.",
    )

  return out
}

/** Every question answered "Not known" is followed up by phone before a plan is drafted. */
export function notKnownCount(a: Answers) {
  return Object.values(a).filter(
    (v) => v === NOT_KNOWN || (Array.isArray(v) && v.includes(NOT_KNOWN)),
  ).length
}

/** Questions that must be answered before the form can be sent. */
export const REQUIRED = [
  "A1",
  "A2",
  "A3",
  "A4",
  "B1",
  "B3",
  "C1",
  "C2",
  "D1",
  "D2",
  "D3",
  "D4",
] as const

export const DOCUMENT_TYPES = [
  "Care or support plan",
  "Needs assessment",
  "Consent form",
  "Lasting Power of Attorney or deputyship",
  "Other",
] as const

export const documentSchema = z.object({
  name: z.string(),
  size: z.number().int().nonnegative(),
  type: z.enum(DOCUMENT_TYPES),
})
export type ReferralDocument = z.infer<typeof documentSchema>

export const MAX_FILE_BYTES = 10 * 1024 * 1024
export const ACCEPTED_FILES = ".pdf,.doc,.docx,.jpg,.jpeg,.png"
