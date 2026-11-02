import { setupServer } from "msw/node"

import { handlers } from "@/mocks/handlers"

/** The same request handlers as the browser mock, so tests exercise the real API contract. */
export const server = setupServer(...handlers)
