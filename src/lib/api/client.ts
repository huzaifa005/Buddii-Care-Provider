import { type z } from "zod"

import { env } from "@/lib/env"

import { apiReady } from "./mock-gate"

const REQUEST_TIMEOUT_MS = 20_000
const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"])
/** Django's default CSRF cookie and header names. */
const CSRF_COOKIE = "csrftoken"
const CSRF_HEADER = "X-CSRFToken"

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly body?: unknown,
  ) {
    super(message)
    this.name = "ApiError"
  }

  /**
   * DRF validation errors (`{ field: ["message"] }`) as one message per field,
   * so forms can show them next to the right input.
   */
  get fieldErrors(): Record<string, string> {
    if (this.status !== 400 || !this.body || typeof this.body !== "object") return {}
    return Object.fromEntries(
      Object.entries(this.body)
        .filter(([key, value]) => key !== "detail" && Array.isArray(value) && value.length > 0)
        .map(([key, value]) => [key, String((value as unknown[])[0])]),
    )
  }

  get isUnauthorized() {
    return this.status === 401
  }

  /** The backend refused because the organisation lacks the entitlement (e.g. Care Buddii Pro). */
  get isForbidden() {
    return this.status === 403
  }
}

type QueryValue = string | number | boolean | null | undefined

interface RequestOptions<TSchema extends z.ZodType> extends Omit<RequestInit, "body"> {
  /** Every response is parsed through a schema: unknown fields are stripped, bad shapes throw. */
  schema: TSchema
  query?: Record<string, QueryValue>
  body?: unknown
}

function buildUrl(path: string, query?: Record<string, QueryValue>) {
  const base = env.NEXT_PUBLIC_API_URL.replace(/\/$/, "")
  const url = `${base}/${path.replace(/^\//, "")}`
  if (!query) return url

  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== "") params.set(key, String(value))
  }
  const qs = params.toString()
  return qs ? `${url}?${qs}` : url
}

function readCookie(name: string) {
  if (typeof document === "undefined") return undefined
  const match = document.cookie.split("; ").find((row) => row.startsWith(`${name}=`))
  return match ? decodeURIComponent(match.slice(name.length + 1)) : undefined
}

async function request<TSchema extends z.ZodType>(
  path: string,
  { schema, query, body, headers, signal, method = "GET", ...init }: RequestOptions<TSchema>,
): Promise<z.output<TSchema>> {
  await apiReady
  const csrfToken = UNSAFE_METHODS.has(method) ? readCookie(CSRF_COOKIE) : undefined
  const timeout = AbortSignal.timeout(REQUEST_TIMEOUT_MS)

  let response: Response
  try {
    response = await fetch(buildUrl(path, query), {
      ...init,
      method,
      // Session auth: the httpOnly session cookie travels with every request.
      credentials: "include",
      signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
      headers: {
        Accept: "application/json",
        ...(body !== undefined && { "Content-Type": "application/json" }),
        ...(csrfToken && { [CSRF_HEADER]: csrfToken }),
        ...headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") {
      throw new ApiError(0, "The server took too long to respond. Please try again.")
    }
    throw error
  }

  const data: unknown =
    response.status === 204 ? undefined : await response.json().catch(() => undefined)

  if (!response.ok) {
    const detail =
      data && typeof data === "object" && "detail" in data && typeof data.detail === "string"
        ? data.detail
        : response.statusText
    throw new ApiError(response.status, detail || `Request failed (${response.status})`, data)
  }

  return schema.parse(data)
}

export const apiClient = {
  get: <S extends z.ZodType>(path: string, options: Omit<RequestOptions<S>, "body" | "method">) =>
    request(path, { ...options, method: "GET" }),
  post: <S extends z.ZodType>(path: string, options: Omit<RequestOptions<S>, "method">) =>
    request(path, { ...options, method: "POST" }),
  patch: <S extends z.ZodType>(path: string, options: Omit<RequestOptions<S>, "method">) =>
    request(path, { ...options, method: "PATCH" }),
  put: <S extends z.ZodType>(path: string, options: Omit<RequestOptions<S>, "method">) =>
    request(path, { ...options, method: "PUT" }),
  delete: <S extends z.ZodType>(
    path: string,
    options: Omit<RequestOptions<S>, "body" | "method">,
  ) => request(path, { ...options, method: "DELETE" }),
}
