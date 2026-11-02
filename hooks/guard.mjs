#!/usr/bin/env node
/**
 * Claude Code PreToolUse safety hook (Bash, PowerShell, Write, Edit).
 *
 * Adapted from hooks/block-dangerous.sh in github.com/xDAnkit/system-design-journey.
 * - "deny": never allowed for an agent (history rewrites, skipped hooks, protected files).
 * - "ask":  allowed only after the user confirms (stopping processes, recursive deletes,
 *           database writes, security-sensitive files).
 * - anything else passes through to the normal permission flow.
 *
 * Reads the hook payload from stdin and prints a hookSpecificOutput decision.
 * Tested by hooks/guard.test.mjs (`npm run test:hooks`).
 */

import path from "node:path"
import { fileURLToPath } from "node:url"

const lower = (s) => String(s ?? "").toLowerCase()
const normalisePath = (p) => lower(p).replaceAll("\\", "/")

/** Files an agent must never write: secrets, git internals, and the guard itself. */
const PROTECTED_PATHS = [
  /(^|\/)\.env(\.(?!example$)[^/]*)?$/, // .env, .env.local… but not .env.example
  /(^|\/)\.git(\/|$)/,
  /(^|\/)\.husky\//,
  /(^|\/)hooks\/guard\.(test\.)?mjs$/,
  /(^|\/)\.claude\/settings(\.local)?\.json$/,
]

/** Security-sensitive files: editable, but only after the user confirms. */
const CONFIRM_PATHS = [
  /(^|\/)next\.config\.ts$/,
  /(^|\/)src\/proxy\.ts$/,
  /(^|\/)docs\/security\.md$/,
  /(^|\/)agents\.md$/,
]

/** [rule name, pattern] for shell commands that are never allowed. */
const DENY_COMMANDS = [
  ["skip-git-hooks", /--no-verify|core\.hookspath/],
  ["git-force-push", /git\s+push\b.*(\s-f\b|--force|\s\+\S)/],
  ["git-reset-hard", /git\s+reset\s+.*--hard/],
  ["git-discard", /git\s+(checkout\s+--|restore\b)/],
  ["git-clean", /git\s+clean\b(?!.*(\s-n\b|--dry-run))/],
  ["git-config", /git\s+(-c\s+\S+\s+)*config\b(?!\s+(--get|--list|-l)\b)/],
  [
    "pipe-to-shell",
    /(curl|wget|iwr|invoke-webrequest)\b.*\|\s*(ba|z)?sh\b|base64\s+(-d|--decode).*\|\s*(ba)?sh\b/,
  ],
  ["disk-wipe", /\b(mkfs|shred|format-volume|clear-disk)\b|\bdd\s+.*\bof=/],
  [
    "write-protected",
    /(>|>>|out-file|set-content|add-content)\s*["']?[^|;&]*(\.env\b(?!\.example)|\.git\/|\.husky\/|hooks\/guard)/,
  ],
]

/** [rule name, pattern] for shell commands that need the user's go-ahead. */
const ASK_COMMANDS = [
  ["stop-process", /(^|[\s;&|(])(kill|pkill|killall|taskkill)\b|stop-process\b/],
  [
    "recursive-delete",
    /\brm\s+(-[a-z]*r[a-z]*f|-[a-z]*f[a-z]*r)\b|\brm\b.*(\s-r\b|--recursive).*(\s-f\b|--force)|\brimraf\b|\bfind\b.*\s-delete\b/,
  ],
  ["recursive-delete", /remove-item\b.*-recurse|\b(rmdir|rd)\s+\/s\b|\bdel\s+\/s\b/],
  [
    "database-write",
    /\b(delete\s+from|drop\s+(table|database|schema|index)|truncate\s+table|flushall|flushdb|deletemany|updatemany)\b|\bupdate\s+[\w."]+\s+set\b/,
  ],
  ["django-db", /manage\.py\s+(flush|migrate\s+\S+\s+zero|sqlflush)\b/],
]

function decide(payload) {
  const tool = String(payload?.tool_name ?? "")
  const input = payload?.tool_input ?? {}

  if (tool === "Write" || tool === "Edit" || tool === "NotebookEdit") {
    const path = normalisePath(input.file_path ?? input.notebook_path)
    if (PROTECTED_PATHS.some((re) => re.test(path))) {
      return ["deny", `protected file (${path.split("/").slice(-2).join("/")})`]
    }
    if (CONFIRM_PATHS.some((re) => re.test(path))) {
      return ["ask", "security-sensitive file, confirm the change"]
    }
    return null
  }

  if (tool === "Bash" || tool === "PowerShell") {
    const command = lower(input.command).replaceAll("\\", "/")
    if (!command.trim()) return ["deny", "empty command"]
    for (const [rule, re] of DENY_COMMANDS) if (re.test(command)) return ["deny", rule]
    for (const [rule, re] of ASK_COMMANDS) if (re.test(command)) return ["ask", rule]
  }
  return null
}

function respond(decision) {
  if (!decision) return // no output: the normal permission flow decides
  const [permissionDecision, rule] = decision
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision,
        permissionDecisionReason:
          permissionDecision === "deny"
            ? `Blocked by the Buddii safety hook (${rule}). Ask the user to run it themselves.`
            : `Buddii safety hook: ${rule}. Confirm before it runs.`,
      },
    }),
  )
}

export { decide }

// Run as a hook only when executed directly (tests import `decide`).
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  let raw = ""
  process.stdin.setEncoding("utf8")
  process.stdin.on("data", (chunk) => (raw += chunk))
  process.stdin.on("end", () => {
    let payload
    try {
      payload = JSON.parse(raw)
    } catch {
      respond(["deny", "unreadable hook input"])
      return
    }
    respond(decide(payload))
  })
}
