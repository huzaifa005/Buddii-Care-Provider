import { getResponse } from "msw"

import { handlers } from "@/mocks/handlers"

/**
 * Fallback for the mock API. The browser normally answers `/api/v1/*` with the MSW service
 * worker. When the worker cannot start (a network IP over plain HTTP, a private window, or
 * service workers are blocked), requests reach this route, which runs the same handlers on the
 * server. Off unless NEXT_PUBLIC_API_MOCKING=enabled; a real deployment routes these paths to
 * the Django API instead.
 */
const enabled = process.env.NEXT_PUBLIC_API_MOCKING === "enabled"

async function handle(request: Request) {
  if (!enabled) return Response.json({ detail: "Not found." }, { status: 404 })
  const response = await getResponse(handlers, request, {
    baseUrl: new URL(request.url).origin,
  })
  return response ?? Response.json({ detail: "Not found." }, { status: 404 })
}

export { handle as DELETE, handle as GET, handle as PATCH, handle as POST, handle as PUT }
