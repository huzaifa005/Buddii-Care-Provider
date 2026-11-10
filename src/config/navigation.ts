import { type AppIcon, NavIcons } from "@/lib/icons"

export type NavGroup = "Main" | "Programme" | "Administration"

export interface NavItem {
  id: string
  group: NavGroup
  title: string
  href: string
  icon: AppIcon
  /** Shown under the page title. */
  description: string
}

/**
 * The 10 free Provider Portal sections, with the same terms as the Council Dashboard
 * (CLAUDE.md rule 4). New assignments live in the Action Centre and at /assignments.
 */
export const PORTAL_NAV = [
  {
    id: "home",
    group: "Main",
    title: "Overview",
    href: "/",
    icon: NavIcons.home,
    description: "Today's volunteer activity and new council assignments",
  },
  {
    id: "residents",
    group: "Main",
    title: "Residents",
    href: "/residents",
    icon: NavIcons.residents,
    description: "Residents assigned through the Buddii programme",
  },
  {
    id: "action-centre",
    group: "Main",
    title: "Action Centre",
    href: "/action-centre",
    icon: NavIcons.assignments,
    description: "Council requests, new assignments, review dates and observations in one list",
  },
  {
    id: "support-requests",
    group: "Main",
    title: "Support Requests",
    href: "/support-requests",
    icon: NavIcons.requests,
    description: "Request and track volunteer support for your residents",
  },
  {
    id: "volunteer-activity",
    group: "Programme",
    title: "Volunteer Activity",
    href: "/volunteer-activity",
    icon: NavIcons.activity,
    description: "Completed, upcoming and missed visits, and observations to respond to",
  },
  {
    id: "outcomes",
    group: "Programme",
    title: "Outcomes",
    href: "/outcomes",
    icon: NavIcons.outcomes,
    description: "Wellbeing (WEMWBS) and loneliness (UCLA) from Council-verified assessments",
  },
  {
    id: "messages",
    group: "Programme",
    title: "Messages",
    href: "/messages",
    icon: NavIcons.messages,
    description: "Audited communication with the Volunteer Coordinator",
  },
  {
    id: "safeguarding",
    group: "Administration",
    title: "Safeguarding",
    href: "/safeguarding",
    icon: NavIcons.safeguarding,
    description: "Report concerns and track routing status",
  },
  {
    id: "reports",
    group: "Administration",
    title: "Reports",
    href: "/reports",
    icon: NavIcons.reports,
    description: "Standard programme activity and outcome reports",
  },
  {
    id: "settings",
    group: "Administration",
    title: "Settings",
    href: "/settings",
    icon: NavIcons.settings,
    description: "Provider users, roles and preferences",
  },
] as const satisfies readonly NavItem[]

export const NAV_GROUPS: readonly NavGroup[] = ["Main", "Programme", "Administration"]

export type PortalSectionId = (typeof PORTAL_NAV)[number]["id"]

export function getNavItem(id: PortalSectionId) {
  // Safe: `id` is constrained to the literal ids above.
  return PORTAL_NAV.find((item) => item.id === id)!
}

/** Longest-prefix match so nested routes (e.g. /residents/BUD-0009) highlight their section. */
export function findActiveNavItem(pathname: string) {
  return [...PORTAL_NAV]
    .sort((a, b) => b.href.length - a.href.length)
    .find((item) => (item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)))
}
