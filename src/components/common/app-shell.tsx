"use client";

import * as React from "react";
import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { NotificationBell } from "@/components/common/notification-bell";
import { CalendarDays } from "lucide-react";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [todayFormatted, setTodayFormatted] = React.useState<string>("");

  React.useEffect(() => {
    setTodayFormatted(
      new Intl.DateTimeFormat("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      }).format(new Date())
    );
  }, []);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-background min-h-screen flex flex-col transition-colors">
        {/* Skip to Main Content Link for Accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-3 focus:py-1.5 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-sm focus:font-medium focus:text-xs focus:outline-none focus:ring-1 focus:ring-ring"
        >
          Skip to main content
        </a>

        <header
          role="banner"
          className="sticky top-0 z-40 flex h-12 shrink-0 items-center justify-between gap-3 px-4 sm:px-5 bg-background/95 border-b border-border backdrop-blur-xs transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <SidebarTrigger
              aria-label="Toggle sidebar navigation"
              className="-ml-1 text-muted-foreground hover:text-foreground hover:bg-muted/70 rounded-md size-8 transition-colors cursor-pointer"
            />
            <Separator
              orientation="vertical"
              className="h-3.5 bg-border hidden sm:block"
            />
            <Breadcrumb className="hidden sm:block" aria-label="Breadcrumb navigation">
              <BreadcrumbList className="text-xs font-normal">
                <BreadcrumbItem>
                  <BreadcrumbLink
                    href="/dashboard"
                    className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 font-medium cursor-pointer"
                  >
                    <CalendarDays className="size-3.5 opacity-70 shrink-0" />
                    <span>Dashboard</span>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="text-muted-foreground/30" />
                <BreadcrumbItem>
                  <BreadcrumbPage className="font-medium text-foreground">
                    Planner
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Minimal Today Badge */}
            <div
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/60 border border-border text-[11px] font-medium text-muted-foreground select-none"
              title="Current Date"
            >
              <span className="size-1.5 rounded-full bg-emerald-500 shrink-0" />
              <span className="tracking-tight text-foreground font-semibold">{todayFormatted}</span>
            </div>

            <NotificationBell />
          </div>
        </header>

        <main
          id="main-content"
          tabIndex={-1}
          className="flex flex-1 flex-col p-3 sm:p-4 lg:p-5 outline-none"
        >
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
