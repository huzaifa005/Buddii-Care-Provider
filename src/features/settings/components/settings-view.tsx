"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { UserPlus } from "lucide-react"
import { parseAsStringLiteral, useQueryState } from "nuqs"
import { useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"

import { PageHeader } from "@/components/shared/page-header"
import { Panel, PanelHeader } from "@/components/shared/panel"
import { QueryBoundary } from "@/components/shared/query-boundary"
import { StatusDot } from "@/components/shared/status-dot"
import { tableCell, tableHead } from "@/components/shared/table-styles"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useCan } from "@/features/session/api"
import { FREE_PORTAL_ROLES, PROVIDER_ROLE_LABELS } from "@/features/session/schemas"
import { ApiError } from "@/lib/api/client"
import { formatDayMonth, formatTime, initials } from "@/lib/format"

import {
  useInviteUser,
  useNotificationSettings,
  useOrganisation,
  useSaveNotificationSettings,
  useUsers,
} from "../api"
import {
  type InviteUser,
  inviteUserSchema,
  NOTIFICATION_KEYS,
  type NotificationSettings,
} from "../schemas"

const TABS = ["users", "organisation", "notifications"] as const

const NOTIFICATION_LABEL: Record<(typeof NOTIFICATION_KEYS)[number], [string, string]> = {
  newAssignment: ["New council assignment", "When the council assigns a resident to you"],
  observationNeedsResponse: [
    "Observation needs response",
    "When a volunteer flags something for review",
  ],
  requestMatched: ["Support request matched", "When a volunteer is matched to your request"],
  safeguardingUpdate: ["Safeguarding update", "When a concern you raised changes status"],
  coordinatorMessage: ["Coordinator message", "New messages from the Volunteer Coordinator"],
  weeklySummary: ["Weekly summary", "A Monday digest of activity and outcomes"],
}

export function SettingsView() {
  const [tab, setTab] = useQueryState("tab", parseAsStringLiteral(TABS).withDefault("users"))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users & Settings"
        description="Manage who can use the portal and how you are notified"
      />
      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v === "users" ? null : (v as (typeof TABS)[number]))}
      >
        <TabsList className="h-auto rounded-xl bg-card p-1 shadow-card">
          {[
            ["users", "Users"],
            ["organisation", "Organisation"],
            ["notifications", "Notifications"],
          ].map(([value, label]) => (
            <TabsTrigger
              key={value}
              value={value!}
              className="h-8 rounded-lg px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="users" className="mt-6">
          <UsersTab />
        </TabsContent>
        <TabsContent value="organisation" className="mt-6">
          <OrganisationTab />
        </TabsContent>
        <TabsContent value="notifications" className="mt-6">
          <NotificationsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function UsersTab() {
  const query = useUsers()
  const [inviting, setInviting] = useState(false)
  const canManage = useCan("users.manage")
  return (
    <Panel className="p-0">
      <PanelHeader
        className="mb-0 border-b px-6 py-5"
        title="Provider users"
        description="People in your organisation with portal access"
        action={
          canManage && (
            <Button className="h-9 rounded-lg" onClick={() => setInviting(true)}>
              <UserPlus aria-hidden />
              Invite user
            </Button>
          )
        }
      />
      <QueryBoundary query={query} fallback={<Skeleton className="m-6 h-48" />}>
        {(users) => (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className={tableHead}>Name</TableHead>
                <TableHead className={tableHead}>Role</TableHead>
                <TableHead className={tableHead}>Status</TableHead>
                <TableHead className={tableHead}>Last active</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className={tableCell}>
                    <div className="flex items-center gap-3">
                      <Avatar className="size-8">
                        <AvatarFallback className="bg-accent text-xs font-semibold text-accent-foreground">
                          {initials(u.displayName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-heading">{u.displayName}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className={tableCell}>{PROVIDER_ROLE_LABELS[u.role]}</TableCell>
                  <TableCell className={tableCell}>
                    <StatusDot
                      tone={
                        u.status === "ACTIVE"
                          ? "success"
                          : u.status === "INVITED"
                            ? "info"
                            : "neutral"
                      }
                    >
                      {u.status === "ACTIVE"
                        ? "Active"
                        : u.status === "INVITED"
                          ? "Invited"
                          : "Suspended"}
                    </StatusDot>
                  </TableCell>
                  <TableCell className={`${tableCell} text-muted-foreground`}>
                    {u.lastActiveAt
                      ? `${formatDayMonth(u.lastActiveAt)}, ${formatTime(u.lastActiveAt)}`
                      : "Never"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </QueryBoundary>
      <InviteDialog open={inviting} onOpenChange={setInviting} />
    </Panel>
  )
}

function InviteDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const mutation = useInviteUser()
  const form = useForm<InviteUser>({
    resolver: zodResolver(inviteUserSchema),
    defaultValues: { displayName: "", email: "", role: "PROVIDER_PRACTITIONER" },
  })
  const close = () => {
    onOpenChange(false)
    form.reset()
  }
  const onSubmit = form.handleSubmit(async (input) => {
    try {
      await mutation.mutateAsync(input)
      toast.success("Invitation sent", {
        description: `${input.email} will receive a sign-in link.`,
      })
      close()
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not send the invitation")
    }
  })

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : close())}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite a user</DialogTitle>
          <DialogDescription>
            They will get an email to set up their portal access.
          </DialogDescription>
        </DialogHeader>
        <form id="invite-user" onSubmit={onSubmit} className="space-y-5">
          {(
            [
              ["displayName", "Full name", "text"],
              ["email", "Work email", "email"],
            ] as const
          ).map(([name, label, type]) => (
            <Controller
              key={name}
              control={form.control}
              name={name}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={`iu-${name}`}>{label}</FieldLabel>
                  <Input
                    id={`iu-${name}`}
                    type={type}
                    className="h-10"
                    {...field}
                    aria-invalid={fieldState.invalid}
                  />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
          ))}
          <Controller
            control={form.control}
            name="role"
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor="iu-role">Role</FieldLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="iu-role" className="h-10 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FREE_PORTAL_ROLES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {PROVIDER_ROLE_LABELS[r]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}
          />
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={close}>
            Cancel
          </Button>
          <Button type="submit" form="invite-user" disabled={mutation.isPending}>
            {mutation.isPending && <Spinner />}
            Send invitation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function OrganisationTab() {
  const query = useOrganisation()
  return (
    <QueryBoundary query={query} fallback={<Skeleton className="h-64 rounded-panel" />}>
      {(org) => (
        <div className="grid gap-6 lg:grid-cols-3">
          <Panel className="lg:col-span-2">
            <PanelHeader title={org.name} description={`Provider reference ${org.providerRef}`} />
            <dl className="grid gap-4 sm:grid-cols-2">
              {[
                ["Programme", org.programme],
                ["Council", org.council],
                ["Primary contact", org.primaryContact],
                ["Data protection contact", org.dataProtectionContact],
              ].map(([k, v]) => (
                <div key={k} className="rounded-lg border p-4">
                  <dt className="text-xs text-muted-foreground">{k}</dt>
                  <dd className="mt-1 text-sm font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </Panel>
          <Panel>
            <PanelHeader title="Service area" description="Postcode districts you cover" />
            <ul className="flex flex-wrap gap-2">
              {org.serviceArea.map((p) => (
                <li
                  key={p}
                  className="rounded-md bg-muted px-2.5 py-1 text-sm font-medium tabular-nums"
                >
                  {p}
                </li>
              ))}
            </ul>
            <p className="mt-5 text-xs text-muted-foreground">
              Organisation details are managed by the council. Contact your programme lead to change
              them.
            </p>
          </Panel>
        </div>
      )}
    </QueryBoundary>
  )
}

function NotificationsTab() {
  const query = useNotificationSettings()
  return (
    <QueryBoundary query={query} fallback={<Skeleton className="h-80 rounded-panel" />}>
      {(settings) => <NotificationsForm key={JSON.stringify(settings)} initial={settings} />}
    </QueryBoundary>
  )
}

function NotificationsForm({ initial }: { initial: NotificationSettings }) {
  const [values, setValues] = useState(initial)
  const save = useSaveNotificationSettings()
  const dirty = JSON.stringify(values) !== JSON.stringify(initial)

  return (
    <Panel className="p-0">
      <PanelHeader
        className="mb-0 border-b px-6 py-5"
        title="Notification preferences"
        description="Choose how you hear about programme events"
      />
      <div className="grid grid-cols-[1fr_72px_72px] border-b px-6 py-2 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
        <span>Event</span>
        <span className="text-center">Email</span>
        <span className="text-center">In app</span>
      </div>
      <ul className="divide-y">
        {NOTIFICATION_KEYS.map((key) => {
          const [label, hint] = NOTIFICATION_LABEL[key]
          return (
            <li key={key} className="grid grid-cols-[1fr_72px_72px] items-center px-6 py-4">
              <span>
                <span className="block text-sm font-medium">{label}</span>
                <span className="block text-xs text-muted-foreground">{hint}</span>
              </span>
              {(["email", "inApp"] as const).map((channel) => (
                <span key={channel} className="flex justify-center">
                  <Switch
                    checked={values[key][channel]}
                    onCheckedChange={(checked) =>
                      setValues((v) => ({ ...v, [key]: { ...v[key], [channel]: checked } }))
                    }
                    aria-label={`${label} by ${channel === "email" ? "email" : "in-app notification"}`}
                  />
                </span>
              ))}
            </li>
          )
        })}
      </ul>
      <div className="flex justify-end gap-2 border-t px-6 py-4">
        <Button variant="outline" disabled={!dirty} onClick={() => setValues(initial)}>
          Reset
        </Button>
        <Button
          disabled={!dirty || save.isPending}
          onClick={() =>
            save.mutate(values, {
              onSuccess: () => toast.success("Notification preferences saved"),
              onError: () => toast.error("Could not save preferences"),
            })
          }
        >
          {save.isPending && <Spinner />}
          Save changes
        </Button>
      </div>
    </Panel>
  )
}
