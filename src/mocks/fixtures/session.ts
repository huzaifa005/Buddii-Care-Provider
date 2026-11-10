import { type Session } from "@/features/session/schemas"

export const sessionFixture: Session = {
  user: {
    id: "usr_0001",
    displayName: "Sarah M.",
    email: "sarah.m@bromleycare.example",
    role: "PROVIDER_ADMINISTRATOR",
  },
  organisation: {
    id: "org_bromley_care",
    name: "Bromley Care Services",
    programme: "LB Bromley",
  },
  // Free tier only: every Care Buddii Pro surface should render as locked.
  entitlements: ["BUDDII_PROVIDER_CORE"],
}
