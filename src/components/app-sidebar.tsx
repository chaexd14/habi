"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";

import { NavMain } from "@/components/nav-main";
import { NavCategory } from "@/components/nav-category";
import { NavUser, NavUserSkeleton } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { Repeat, CalendarDays, Layers } from "lucide-react";
import { useProfile } from "@/providers/profile-provider";
import { NavSchedule } from "@/components/nav-schedule";

import Link from "next/link";

function AppSidebarInner({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { userProfile } = useProfile();
  const searchParams = useSearchParams();
  const currentType = searchParams.get("type") || "all";

  return (
    <Sidebar
      variant="inset"
      {...props}
      className="border-r border-sidebar-border bg-sidebar"
    >
      <SidebarHeader className="p-2.5 pb-2 border-b border-sidebar-border">
        {userProfile ? <NavUser userProfile={userProfile} /> : <NavUserSkeleton />}
      </SidebarHeader>

      <SidebarContent className="px-2 py-2.5 space-y-3">
        {/* Interactive Mini Calendar */}
        <NavMain />

        {/* View Modes */}
        <SidebarGroup className="p-0">
          <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 px-2 mb-1">
            Views
          </SidebarGroupLabel>
          <SidebarMenu className="space-y-0.5">
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={currentType === "all"}
                render={<Link href="/dashboard?type=all" />}
                className="h-8 text-xs font-medium rounded-md px-2.5 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground data-[active=true]:font-semibold"
              >
                <Layers className="size-3.5 opacity-70" />
                <span>All Events</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={currentType === "calendar"}
                render={<Link href="/dashboard?type=calendar" />}
                className="h-8 text-xs font-medium rounded-md px-2.5 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground data-[active=true]:font-semibold"
              >
                <CalendarDays className="size-3.5 opacity-70" />
                <span>Calendar</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={currentType === "schedule"}
                render={<Link href="/dashboard?type=schedule" />}
                className="h-8 text-xs font-medium rounded-md px-2.5 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground data-[active=true]:font-semibold"
              >
                <Repeat className="size-3.5 opacity-70" />
                <span>Schedule</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {/* Schedules Collapsible */}
        <NavSchedule />

        {/* Categories Collapsible */}
        <NavCategory />
      </SidebarContent>
    </Sidebar>
  );
}

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  return (
    <React.Suspense fallback={<Sidebar variant="inset" {...props} />}>
      <AppSidebarInner {...props} />
    </React.Suspense>
  );
}

export default AppSidebar;
