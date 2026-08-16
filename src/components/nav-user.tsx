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

import createClient from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export function NavUserSkeleton() {
  return (
    <div className="flex items-center gap-3 p-1">
      <Skeleton className="size-9 rounded-full shrink-0" />
      <div className="flex-1 space-y-1.5 min-w-0">
        <Skeleton className="h-3.5 w-24 rounded" />
        <Skeleton className="h-2.5 w-16 rounded" />
      </div>
    </div>
  )
}

export function NavUser({ userProfile }: { userProfile: UserProfile }) {
  const { isMobile } = useSidebar()
  const router = useRouter()

  const handleLogout = async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      if (typeof window !== "undefined") {
        sessionStorage.clear()
      }
      router.push("/auth/login")
      router.refresh()
    } catch (err) {
      console.error("Failed to sign out:", err)
    }
  }

  const initials = userProfile.user_name
    ? userProfile.user_name.slice(0, 2).toUpperCase()
    : "HB"

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                className="h-12 rounded-xl p-2 transition-all hover:bg-sidebar-accent aria-expanded:bg-sidebar-accent"
              />
            }
          >
            <Avatar className="size-8.5 rounded-lg border border-sidebar-border shadow-2xs">
              <AvatarImage src={userProfile.avatar_url} alt={userProfile.user_name} className="object-cover" />
              <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-bold text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-xs leading-tight min-w-0">
              <span className="truncate font-semibold text-foreground text-sm">
                {userProfile.user_name}
              </span>
              <span className="truncate text-[10px] text-muted-foreground">
                {userProfile.timezone || "Habi Planner"}
              </span>
            </div>
            <ChevronsUpDownIcon className="ml-auto size-3.5 text-muted-foreground/70 shrink-0" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="min-w-56 rounded-xl border border-border/80 bg-card p-1.5 shadow-xl"
            side={isMobile ? "bottom" : "right"}
            align="start"
            sideOffset={8}
          >
            <DropdownMenuLabel className="px-2.5 py-1.5 text-xs text-muted-foreground font-medium">
              Signed in as <strong className="text-foreground font-semibold">@{userProfile.user_name}</strong>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="my-1" />
            <DropdownMenuGroup className="space-y-0.5">
              <DropdownMenuItem className="h-9 px-2.5 rounded-lg text-xs font-medium cursor-pointer">
                <BadgeCheckIcon className="size-4 mr-2 text-muted-foreground" />
                Profile Settings
              </DropdownMenuItem>
              <DropdownMenuItem className="h-9 px-2.5 rounded-lg text-xs font-medium cursor-pointer">
                <BellIcon className="size-4 mr-2 text-muted-foreground" />
                Notification Preferences
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="my-1" />
            <DropdownMenuItem
              onClick={handleLogout}
              className="h-9 px-2.5 rounded-lg text-xs font-medium text-destructive hover:bg-destructive/10 hover:text-destructive cursor-pointer"
            >
              <LogOutIcon className="size-4 mr-2" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
