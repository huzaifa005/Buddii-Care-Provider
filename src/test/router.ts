import { vi } from "vitest"

/** Spy for next/navigation's router; assert on it to check redirects. */
export const router = {
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  prefetch: vi.fn(),
  refresh: vi.fn(),
}
