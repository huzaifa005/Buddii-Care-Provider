"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Suspense, useEffect } from "react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import { findActiveNavItem, NAV_GROUPS, PORTAL_NAV } from "@/config/navigation"
import { siteConfig } from "@/config/site"

// Council Dashboard Figma: 45px rows, 18px text, filled 22px icons; the active row is a
// full-width green bar. Collapsed (icon rail): 44px centred tiles, the active one green.
const itemClass = [
  "h-[45px] gap-[13.5px] rounded-[9px] px-[13.5px] text-[18px] leading-[27px] text-sidebar-foreground [&>svg]:size-[22px]",
  "hover:bg-sidebar-accent hover:text-white",
  "data-[active=true]:rounded-none data-[active=true]:bg-success data-[active=true]:font-medium data-[active=true]:text-white",
  "group-data-[collapsible=icon]:size-11! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:rounded-[10px]! group-data-[collapsible=icon]:p-0! group-data-[collapsible=icon]:[&>span]:hidden",
].join(" ")

/** Below this width the sidebar starts as an icon rail so content keeps its room. */
const COMPACT_QUERY = "(max-width: 1279px)"

export function AppSidebar() {
  const { setOpen } = useSidebar()

  useEffect(() => {
    const query = window.matchMedia(COMPACT_QUERY)
    const apply = () => setOpen(!query.matches)
    if (query.matches) apply()
    query.addEventListener("change", apply)
    return () => query.removeEventListener("change", apply)
  }, [setOpen])

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="h-24 justify-center px-6 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-0">
        <Link
          href="/"
          aria-label={`${siteConfig.name} home`}
          // Collapsed: show only the logo mark (cropped, the asset itself is unchanged).
          className="block overflow-hidden group-data-[collapsible=icon]:w-[34px]"
        >
          <Image
            src="/brand/buddii-logo.svg"
            alt="Buddii"
            width={122}
            height={35}
            priority
            unoptimized
            className="max-w-none"
          />
        </Link>
      </SidebarHeader>

      <SidebarContent className="sidebar-scroll gap-0 px-0 pb-6">
        {/*
         * usePathname can suspend on routes with dynamic params.
         * The fallback renders the same links without an active item, so the shell still
         * prerenders and only the highlight waits for the client.
         */}
        <Suspense fallback={<NavLinks />}>
          <ActiveNavLinks />
        </Suspense>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}

function ActiveNavLinks() {
  const activeId = findActiveNavItem(usePathname())?.id
  return <NavLinks activeId={activeId} />
}

function NavLinks({ activeId }: { activeId?: string }) {
  const { setOpenMobile } = useSidebar()
  return NAV_GROUPS.map((group, index) => (
    <SidebarGroup key={group} className="p-0 group-data-[collapsible=icon]:items-center">
      <SidebarGroupLabel className="h-auto px-[13.5px] pt-[18px] pb-[9px] text-[14px] leading-[19px] font-semibold tracking-[0.675px] text-sidebar-label uppercase group-data-[collapsible=icon]:hidden">
        {group}
      </SidebarGroupLabel>
      {/* Collapsed rail: a short rule between groups instead of the label. */}
      <span
        aria-hidden
        className={
          index === 0
            ? "hidden"
            : "my-3 hidden h-px w-8 bg-sidebar-border group-data-[collapsible=icon]:block"
        }
      />
      <SidebarGroupContent>
        <SidebarMenu className="gap-[5px] group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:gap-1.5">
          {PORTAL_NAV.filter((item) => item.group === group).map((item) => (
            <SidebarMenuItem key={item.id}>
              <SidebarMenuButton
                asChild
                isActive={item.id === activeId}
                tooltip={item.title}
                className={itemClass}
              >
                <Link href={item.href} onClick={() => setOpenMobile(false)}>
                  <item.icon aria-hidden />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  ))
}
