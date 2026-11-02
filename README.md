# Buddii Provider Portal

The web portal that care providers (home care agencies and care homes) use in the council-run
**Buddii** volunteering programme. Providers confirm council assignments, request volunteer
support for their clients, respond to volunteer observations, follow outcomes, message the
Volunteer Coordinator and raise safeguarding concerns.

This is the **free Provider Portal**. It covers volunteer coordination only. Regulated care
features (medication, care plans, GPS/EVV, carer rotas, DBS) belong to the separate paid product
_Care Buddii Pro_. They must not appear here, in the UI or in this app's API calls.

|               |                                                                 |
| ------------- | --------------------------------------------------------------- |
| Client        | Hamden Technology Ltd                                           |
| Delivery      | GYB Commerce                                                    |
| Backend       | Django / DRF (separate repository)                              |
| Design source | Figma "Buddii-app" › Council Dashboard (shared design language) |

---

## Quick start

Requirements: **Node 24+** (see `.nvmrc`) and npm.

```bash
npm install
cp .env.example .env.local      # mock API is on by default
npm run dev                     # http://localhost:3000
```

With mocking on, the app runs against an in-browser mock of the API
([Mock Service Worker](https://mswjs.io)), so no backend is needed.

**Demo sign-in (mock only):** any email, password `buddii-demo`. You start signed in. Use the
user menu › Sign out to see the login flow.

## Scripts

| Command                               | What it does                                                          |
| ------------------------------------- | --------------------------------------------------------------------- |
| `npm run dev`                         | Dev server with hot reload                                            |
| `npm run build` / `npm start`         | Production build / serve it                                           |
| `npm run check`                       | Everything CI runs: types, lint, format, unit and integration tests   |
| `npm test` / `npm run test:watch`     | Vitest unit and integration tests                                     |
| `npm run test:coverage`               | Tests with a V8 coverage report                                       |
| `npm run test:e2e`                    | Playwright end-to-end tests in Microsoft Edge (starts the dev server) |
| `npm run openapi`                     | Regenerates `docs/api/openapi.json` from the zod schemas              |
| `npm run lint:fix` / `npm run format` | Auto-fix lint and formatting                                          |

A pre-commit hook (husky and lint-staged) lints and formats staged files.

### AI agent safety hook

`.claude/settings.json` runs `hooks/guard.mjs` before every shell command and file edit an AI
agent (Claude Code) makes in this repo:

| Decision       | Examples                                                                                                                                                                                      |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Blocked        | `--no-verify`, force push, `git reset --hard`, `git clean`, `git config`, `curl … \| sh`, writing `.env*`, `.git/`, `.husky/`, the guard or Claude settings                                   |
| Asks you first | Stopping processes (`kill`, `Stop-Process`), recursive deletes (`rm -rf`, `Remove-Item -Recurse`), database writes, editing `next.config.ts`, `src/proxy.ts`, `docs/SECURITY.md`, `AGENTS.md` |
| Passes         | Everything else (normal permission prompts still apply)                                                                                                                                       |

It guards agent tool calls only, not your own terminal. The rules are tested with
`npm run test:hooks` (part of `npm run check`). Review or disable it with `/hooks` in Claude Code.

## Environment

| Variable                  | Default     | Purpose                                                                           |
| ------------------------- | ----------- | --------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_API_URL`     | `/api/v1`   | Base URL of the Django API. Relative means the same origin as the portal.         |
| `NEXT_PUBLIC_API_MOCKING` | `disabled`  | `enabled` serves mock data in development. It is always off in production builds. |
| `SESSION_COOKIE_NAME`     | `sessionid` | Cookie the route guard (`src/proxy.ts`) checks for. Server-side only.             |

Only `NEXT_PUBLIC_*` values reach the browser. They are inlined at build time, so a change needs
a rebuild. Values are validated at start-up (`src/lib/env.ts`).

## Project layout

```
src/
  app/                 Routes only (Next.js App Router)
    (portal)/          Authenticated shell: sidebar and header around every section
    login/             Sign-in page
  features/<name>/     One folder per product area
    schemas.ts         zod schemas: the API contract and form validation
    api.ts             TanStack Query hooks (queries, mutations, cache keys)
    presentation.ts    Enum → label/tone maps
    components/        Screens and feature components (+ *.test.tsx)
  components/
    ui/                shadcn/ui primitives (generated; edit sparingly)
    shared/            Design-system building blocks (StatCard, Panel, FilterTabs…)
    layout/            App shell (sidebar, header, command palette, notifications)
  lib/                 API client, query client, env, formatting, auth helpers
  config/              Navigation and site constants
  providers/           Client providers (React Query, URL state, MSW, 401 handling)
  mocks/               Mock API: handlers, in-memory db, anonymised fixtures
  test/                Test utilities (render helpers, MSW node server)
  proxy.ts             Route guard (redirects to /login without a session cookie)
e2e/                   Playwright specs
docs/                  Architecture, backend contract, security, testing, design system
scripts/               OpenAPI generator
```

## Documentation

| Document                                                   | Audience                                                                        |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------- |
| [docs/PLATFORM_OVERVIEW.md](docs/PLATFORM_OVERVIEW.md)     | Everyone, start here: how the portal works and how it connects to the council   |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)               | Frontend developers: layers, data flow, conventions, adding a feature           |
| [docs/BACKEND_INTEGRATION.md](docs/BACKEND_INTEGRATION.md) | Backend developers: auth, endpoints, scoping, errors, what the API must enforce |
| [docs/api/openapi.json](docs/api/openapi.json)             | Machine-readable API contract (generated)                                       |
| [docs/SECURITY.md](docs/SECURITY.md)                       | Everyone: threat model, controls, data rules, open items                        |
| [docs/TESTING.md](docs/TESTING.md)                         | Developers and QA: test layers and how to write them                            |
| [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md)             | Designers and frontend: tokens, components, usage rules                         |
| [docs/DECISIONS.md](docs/DECISIONS.md)                     | Leads: decisions made, and open questions that need the client                  |

## Tech stack

Next.js 16 (App Router, Cache Components) · React 19 · TypeScript (strict) · Tailwind CSS 4 ·
shadcn/ui (Radix) · TanStack Query 5 · zod 4 · React Hook Form · nuqs (URL state) · Recharts ·
MSW 3 · Vitest and Testing Library · Playwright and axe.
