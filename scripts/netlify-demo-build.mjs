// Build for the Netlify demo site (mock data). Run by netlify.toml, not by developers.
//
// With mock data the proxy (src/proxy.ts) only passes requests through. Netlify's Next.js
// plugin cannot package that proxy when the build runs on Windows (it loses the Turbopack
// runtime chunk), so this build leaves the proxy out. A real deployment builds on Linux with
// the proxy in place and the mock API disabled.
import { execSync } from "node:child_process"
import { existsSync, renameSync } from "node:fs"

if (process.env.NEXT_PUBLIC_API_MOCKING !== "enabled") {
  throw new Error("The demo build is only for NEXT_PUBLIC_API_MOCKING=enabled.")
}

const proxy = "src/proxy.ts"
const parked = "src/proxy.ts.demo-build"
const park = process.platform === "win32" && existsSync(proxy)

if (park) renameSync(proxy, parked)
try {
  execSync("npx next build", { stdio: "inherit" })
} finally {
  if (park) renameSync(parked, proxy)
}
