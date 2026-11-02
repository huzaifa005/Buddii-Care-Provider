/**
 * Filled icon set used by navigation and KPI cards, matching the Council Dashboard Figma
 * (Material, Ionicons and Bootstrap filled glyphs). Small inline UI glyphs (chevrons, close,
 * arrows) stay on lucide-react.
 */
import {
  BsBellFill,
  BsCalendarEventFill,
  BsChatLeftTextFill,
  BsClipboard2CheckFill,
  BsClockFill,
  BsExclamationCircleFill,
  BsFileEarmarkBarGraphFill,
  BsGearFill,
  BsHeartFill,
  BsInboxFill,
  BsPeopleFill,
  BsPersonFillCheck,
  BsPersonFillExclamation,
  BsShieldFillCheck,
  BsShieldFillExclamation,
  BsStarFill,
  BsBullseye,
  BsHourglassSplit,
} from "react-icons/bs"
import { IoPeopleSharp } from "react-icons/io5"
import { MdHome, MdVolunteerActivism } from "react-icons/md"
import { PiChartLineUpBold } from "react-icons/pi"

export type AppIcon = React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>

export const NavIcons = {
  home: MdHome,
  residents: IoPeopleSharp,
  assignments: BsInboxFill,
  requests: BsClipboard2CheckFill,
  activity: MdVolunteerActivism,
  outcomes: PiChartLineUpBold,
  messages: BsChatLeftTextFill,
  safeguarding: BsShieldFillCheck,
  reports: BsFileEarmarkBarGraphFill,
  settings: BsGearFill,
} satisfies Record<string, AppIcon>

export const KpiIcons = {
  people: BsPeopleFill,
  hours: BsClockFill,
  visits: BsCalendarEventFill,
  wellbeing: BsHeartFill,
  attention: BsExclamationCircleFill,
  awaiting: BsPersonFillExclamation,
  matched: BsPersonFillCheck,
  confidence: BsStarFill,
  goals: BsBullseye,
  concern: BsShieldFillExclamation,
  resolved: BsShieldFillCheck,
  review: BsHourglassSplit,
  volunteer: MdVolunteerActivism,
  bell: BsBellFill,
} satisfies Record<string, AppIcon>
