"use client"

import { QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { ThemeProvider } from "next-themes"
import { NuqsAdapter } from "nuqs/adapters/next/app"

import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { getQueryClient } from "@/lib/api/query-client"

import { MockServiceWorker } from "./mock-service-worker"
import { UnauthorizedRedirect } from "./unauthorized-redirect"

export function AppProviders({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient()

  return (
    // Light only until the Figma design system defines a dark theme.
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <QueryClientProvider client={queryClient}>
        <NuqsAdapter>
          <TooltipProvider delayDuration={200}>
            <MockServiceWorker />
            <UnauthorizedRedirect />
            {children}
            <Toaster richColors position="bottom-right" />
          </TooltipProvider>
        </NuqsAdapter>
        <ReactQueryDevtools buttonPosition="bottom-right" />
      </QueryClientProvider>
    </ThemeProvider>
  )
}
