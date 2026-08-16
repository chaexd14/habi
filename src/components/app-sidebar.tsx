"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"

import { NavMain } from "@/components/nav-main"
import { NavCategory } from "@/components/nav-category"
import { NavUser, NavUserSkeleton } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"
import { Repeat, Calendar, Layers } from "lucide-react"
import { useProfile } from "@/providers/profile-provider"
import { NavSchedule } from "@/components/nav-schedule"

import Link from "next/link"

function AppSidebarInner({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { userProfile } = useProfile();
  const searchParams = useSearchParams();
  const currentType = searchParams.get("type") || "all";

  return (
    <Sidebar variant="inset" {...props} className="border-r border-sidebar-border/60">
      <SidebarHeader className="p-3 pb-2 border-b border-sidebar-border/40">
        {userProfile ? <NavUser userProfile={userProfile} /> : <NavUserSkeleton />}
      </SidebarHeader>
      <SidebarContent className="px-2 py-3 space-y-4">
        <NavMain />
        <SidebarGroup className="p-0">
          <SidebarGroupLabel className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/75 px-2 mb-1">
            Views
          </SidebarGroupLabel>
          <SidebarMenu className="space-y-0.5">
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={currentType === "all"}
                render={<Link href="/dashboard?type=all" />}
                className="h-8.5 text-xs font-medium rounded-lg transition-colors hover:bg-sidebar-accent"
              >
                <Layers className="size-4 opacity-75" />
                <span>All Events</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={currentType === "calendar"}
                render={<Link href="/dashboard?type=calendar" />}
                className="h-8.5 text-xs font-medium rounded-lg transition-colors hover:bg-sidebar-accent"
              >
                <Calendar className="size-4 text-primary" />
                <span>Calendar</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={currentType === "schedule"}
                render={<Link href="/dashboard?type=schedule" />}
                className="h-8.5 text-xs font-medium rounded-lg transition-colors hover:bg-sidebar-accent"
              >
                <Repeat className="size-4 text-blue-500" />
                <span>Schedule</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        <NavSchedule />
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
