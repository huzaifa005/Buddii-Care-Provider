import { redirect } from "next/navigation"

// Outcomes v1 showed a confidence score and automatic goal labels (not allowed, CLAUDE.md
// rule 6). It is retired: the old link opens Outcomes v2.
export default function OutcomesV1Page() {
  redirect("/outcomes")
}
