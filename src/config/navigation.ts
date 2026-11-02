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
 * The 10 free Provider Portal sections. Order and wording are fixed by the
 * client's product split (Vaseem feedback, 19 Aug 2026); change only with sign-off.
 */
export const PORTAL_NAV = [
  {
    id: "home",
    group: "Main",
    title: "Home",
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
    id: "assignments",
    group: "Main",
    title: "New Assignments",
    href: "/assignments",
    icon: NavIcons.assignments,
    description: "Confirm or decline council programme assignments",
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
    title: "Outcomes & Impact",
    href: "/outcomes",
    icon: NavIcons.outcomes,
    description: "Wellbeing, loneliness and volunteer hours",
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
    title: "Users & Settings",
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
