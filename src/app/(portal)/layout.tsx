import { AppHeader } from "@/components/layout/app-header"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

export default function PortalLayout({ children }: LayoutProps<"/">) {
  return (
    <SidebarProvider
      style={
        { "--sidebar-width": "18.25rem", "--sidebar-width-icon": "4.75rem" } as React.CSSProperties
      }
    >
      {/* Keyboard and screen-reader users can jump past the navigation. */}
      <a
        href="#content"
        className="sr-only z-50 rounded-lg px-4 py-2 text-sm font-medium focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:bg-primary focus:text-primary-foreground"
      >
        Skip to content
      </a>
      <AppSidebar />
      {/* SidebarInset renders the page's <main> landmark. */}
      <SidebarInset className="min-w-0 bg-background">
        <AppHeader />
        <div
          id="content"
          tabIndex={-1}
          className="mx-auto w-full max-w-[1280px] flex-1 px-4 py-6 outline-none md:px-8 md:py-10"
        >
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
