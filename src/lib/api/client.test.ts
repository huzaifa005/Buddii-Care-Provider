import { afterEach, describe, expect, it, vi } from "vitest"
import { z } from "zod"

import { ApiError, apiClient } from "./client"

const schema = z.object({ id: z.string() })

function mockFetch(status: number, body?: unknown) {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(body === undefined ? null : JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    }),
  )
  vi.stubGlobal("fetch", fetchMock)
  return fetchMock
}

afterEach(() => vi.unstubAllGlobals())

describe("apiClient", () => {
  it("builds the URL from the API base and drops empty query values", async () => {
    const fetchMock = mockFetch(200, { id: "1" })

    await apiClient.get("/clients", {
      schema,
      query: { status: "ACTIVE", search: "", page: undefined },
    })

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost/api/v1/clients?status=ACTIVE",
      expect.any(Object),
    )
  })

  it("parses the response through the schema", async () => {
    mockFetch(200, { id: "1", extra: "dropped" })

    await expect(apiClient.get("/x", { schema })).resolves.toEqual({ id: "1" })
  })

  it("throws ApiError with the DRF detail message", async () => {
    mockFetch(403, { detail: "Entitlement CARE_MANAGEMENT_PRO required." })

    const error = await apiClient.get("/x", { schema }).catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({
      status: 403,
      isForbidden: true,
      message: "Entitlement CARE_MANAGEMENT_PRO required.",
    })
  })
})
