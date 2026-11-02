import { activityFixture } from "./fixtures/activity"
import { clientsFixture } from "./fixtures/clients"
import { dashboardSummaryFixture } from "./fixtures/home"
import {
  assignmentsFixture,
  inboxFixture,
  concernsFixture,
  notificationsFixture,
  organisationFixture,
  outcomesFixture,
  reportsFixture,
  supportRequestsFixture,
  threadsFixture,
  usersFixture,
} from "./fixtures/programme"
import { referralsFixture } from "./fixtures/referrals"
import { sessionFixture } from "./fixtures/session"

/**
 * In-memory store for the mock API. Mutations (confirm, create, send...) change it so the UI
 * behaves like the real thing for the rest of the browser session; a reload resets it.
 */
const seed = () =>
  structuredClone({
    session: sessionFixture,
    dashboard: dashboardSummaryFixture,
    clients: clientsFixture,
    activity: activityFixture,
    assignments: assignmentsFixture,
    referrals: referralsFixture,
    supportRequests: supportRequestsFixture,
    concerns: concernsFixture,
    threads: threadsFixture,
    outcomes: outcomesFixture,
    reports: reportsFixture,
    users: usersFixture,
    organisation: organisationFixture,
    notifications: notificationsFixture,
    inbox: inboxFixture,
  })

export const db = seed()

/** Restores the seed data. Used between tests so each one starts from the same state. */
export function resetDb() {
  Object.assign(db, seed())
}

const AUTH_KEY = "buddii-mock-signed-out"

/**
 * Mock sign-in state. Kept in sessionStorage so signing out survives a page reload, the way a
 * cleared Django session cookie would; /me answers 401 while signed out.
 */
export const mockAuth = {
  isSignedIn() {
    try {
      return sessionStorage.getItem(AUTH_KEY) !== "true"
    } catch {
      return true
    }
  },
  set(signedIn: boolean) {
    try {
      if (signedIn) sessionStorage.removeItem(AUTH_KEY)
      else sessionStorage.setItem(AUTH_KEY, "true")
    } catch {
      // No storage (e.g. Node without jsdom): stay signed in.
    }
  },
}

let sequence = 100
export const nextId = (prefix: string) => `${prefix}-${++sequence}`

export const nowIso = () => new Date().toISOString()
export const todayIso = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London" }).format(new Date())
