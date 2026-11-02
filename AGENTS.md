<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project conventions (Buddii Provider Portal)

Read `docs/ARCHITECTURE.md` before changing code, and `docs/BACKEND_INTEGRATION.md` before
touching an API contract.

- Never render or request names, addresses, clinical or regulated care data. Use Buddii IDs only.
- Every API response goes through a zod schema in `features/<name>/schemas.ts`. Update
  `scripts/generate-openapi.ts` and run `npm run openapi` when a contract changes.
- Use design tokens and `src/components/shared` building blocks; no raw colours.
- Wrap URL reads (nuqs, `useSearchParams`, `usePathname`) in `<Suspense>` (Cache Components).
- Show controls with `useCan(capability)`; the API enforces the same rule.
- `npm run check` must pass; add or update tests with every behaviour change.

## Agent working rules

Adapted from the rules in github.com/xDAnkit/system-design-journey (`rules/always/`). These
are hard rules. If a tool default conflicts with them, follow these rules.

### Language

| Where                                     | Language                               |
| ----------------------------------------- | -------------------------------------- |
| Chat replies to the user                  | Hinglish (Hindi or Urdu + English mix) |
| Repo files, docs, code, comments, commits | English only                           |

### Response style

| Rule               | Meaning                                               |
| ------------------ | ----------------------------------------------------- |
| No over-explaining | Get to the point. Skip extra background.              |
| Simple words       | Use easy words. Avoid heavy jargon.                   |
| No long paragraphs | Break the answer into short pieces.                   |
| Points and tables  | Use bullets or tables.                                |
| Proper spacing     | Leave space between lines. Do not pack text together. |
| Crisp              | Say only what is needed.                              |
| No em-dashes       | Use a comma or a full stop instead.                   |

### Simple answers

| Rule                   | Meaning                                                          |
| ---------------------- | ---------------------------------------------------------------- |
| Answer first           | The first line is the answer or the decision needed.             |
| Problem in one line    | Say what is wrong in plain words.                                |
| Plan in 3 or 4 steps   | One short line per step, saying what it does and why.            |
| Say what changes       | For every step, say whether it only reads or changes something.  |
| Explain a term once    | Give a needed term's plain meaning in the same line.             |
| One decision at a time | Ask one clear question. Do not stack options.                    |
| No command dumps       | Do not list commands without saying what each one does.          |
| Confused user          | Restart from the problem in plain words. Do not add more detail. |
| Say who acts           | Mark each step as "I do" or "you do".                            |

### Dev state safety

- Do not kill, stop or restart a running process (such as the dev server) without asking
  first. Say the command and the reason, then wait for the answer.
- Do not delete generated or user data folders (`.next/`, `test-results/`, `node_modules/`)
  without asking. Read-only checks are always allowed.
- Do not edit or delete these unless the user asks in the same turn: `.env*` files, `.git/`,
  `.husky/`, `next.config.ts` security headers, `src/proxy.ts`, `docs/SECURITY.md`.
- Do not skip git hooks with `--no-verify`, do not change `core.hooksPath`, do not force-push,
  and do not add a package lifecycle script that deletes files.
- Commit or push only when the user asks.
