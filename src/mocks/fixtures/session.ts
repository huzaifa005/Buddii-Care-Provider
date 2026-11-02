import { type Session } from "@/features/session/schemas"

export const sessionFixture: Session = {
  user: {
    id: "usr_0001",
    displayName: "Sarah M.",
    email: "provider.admin@example.org",
    role: "PROVIDER_ADMINISTRATOR",
  },
  organisation: {
    id: "org_river_garden",
    name: "River Garden Care",
    programme: "Newham",
  },
  // Free tier only: every Care Buddii Pro surface should render as locked.
  entitlements: ["BUDDII_PROVIDER_CORE"],
}
