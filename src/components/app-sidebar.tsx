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

import Link from "next/link"

function AppSidebarInner({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { userProfile } = useProfile();
  const searchParams = useSearchParams();
  const currentType = searchParams.get("type") || "all";

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        {userProfile ? <NavUser userProfile={userProfile} /> : <NavUserSkeleton />}
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/70">
            Views
          </SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={currentType === "all"}
                render={<Link href="/dashboard?type=all" />}
              >
                <Layers className="size-4" />
                <span>All Events</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={currentType === "calendar"}
                render={<Link href="/dashboard?type=calendar" />}
              >
                <Calendar className="size-4 text-primary" />
                <span>Calendar</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={currentType === "schedule"}
                render={<Link href="/dashboard?type=schedule" />}
              >
                <Repeat className="size-4 text-blue-500" />
                <span>Schedule</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <NavMain />
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
