import { format, parseISO } from "date-fns"

/**
 * Buddii is a UK service: every timestamp is shown in UK time, whatever the viewer's
 * device time zone (staff and support may sit elsewhere). Date-only values ("2026-10-21")
 * have no time zone and are formatted as-is.
 */
export const UK_TIME_ZONE = "Europe/London"

const ukDayMonth = new Intl.DateTimeFormat("en-GB", {
  timeZone: UK_TIME_ZONE,
  day: "numeric",
  month: "short",
})
const ukTime = new Intl.DateTimeFormat("en-GB", {
  timeZone: UK_TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
})
// en-CA formats as yyyy-mm-dd, matching the API's ISO date strings.
const ukIsoDate = new Intl.DateTimeFormat("en-CA", { timeZone: UK_TIME_ZONE })

const isDateOnly = (value: string) => !value.includes("T")

/** "River Garden Care" -> "RG" */
export function initials(name: string, max = 2) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, max)
    .map((word) => word[0]!.toUpperCase())
    .join("")
}

/** UK display format for ISO dates from the API, e.g. "6 Jul 2026". */
export function formatDate(isoDate: string) {
  return format(parseISO(isoDate), "d MMM yyyy")
}

/** Compact day and month, e.g. "21 Oct". Datetimes are converted to UK time first. */
export function formatDayMonth(iso: string) {
  return isDateOnly(iso) ? format(parseISO(iso), "d MMM") : ukDayMonth.format(new Date(iso))
}

/** 24-hour UK time, e.g. "13:00". */
export function formatTime(isoDateTime: string) {
  return ukTime.format(new Date(isoDateTime))
}

/** Whether an ISO date is today in the UK. */
export function isToday(isoDate: string, now = new Date()) {
  return isoDate === ukIsoDate.format(now)
}

const numberFormat = new Intl.NumberFormat("en-GB")

export function formatNumber(value: number) {
  return numberFormat.format(value)
}
