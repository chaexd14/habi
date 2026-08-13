"use client"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { ChevronsUpDownIcon, SparklesIcon, BadgeCheckIcon, CreditCardIcon, BellIcon, LogOutIcon, CalendarDaysIcon } from "lucide-react"

import { UserProfile } from "@/types/profile"
import { Skeleton } from "@/components/ui/skeleton"

import { Button } from "@/components/ui/button"

export function NavUserSkeleton() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size="lg" className="pointer-events-none">
          <Skeleton className="size-8 rounded-full" />
          <div className="grid flex-1 gap-1 text-left text-sm leading-tight">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

export function NavUser({ userProfile }: { userProfile: UserProfile }) {
  const { isMobile } = useSidebar()
  return (
    <div className="flex">
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <SidebarMenuButton className="aria-expanded:bg-muted h-11" />
              }
            >
              <Avatar>
                <AvatarImage src={userProfile.avatar_url} alt={userProfile.user_name} className="rounded-sm" />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-lg leading-tight">
                <span className="truncate font-semibold">{userProfile.user_name}</span>
              </div>
              <ChevronsUpDownIcon className="ml-auto size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="min-w-56 rounded-lg"
              side={isMobile ? "bottom" : "right"}
              align="end"
              sideOffset={4}
            >
              <DropdownMenuGroup>
                <DropdownMenuItem className="h-11">
                  <BellIcon
                  />
                  Notifications
                </DropdownMenuItem>
                <DropdownMenuItem className="h-11">
                  <BadgeCheckIcon
                  />
                  Settings
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="h-11">
                <LogOutIcon
                />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <Button variant="ghost" className="h-11">
        <CalendarDaysIcon size={64} />
      </Button>
    </div>
  )
}
