"use client";

import { useState } from "react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { ChevronsUpDown, BadgeCheck, Bell, LogOut } from "lucide-react";
import { UserProfile } from "@/types/profile";
import { Skeleton } from "@/components/ui/skeleton";
import createClient from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { ProfileSettingsModal } from "@/components/user-profile/profile-settings-modal";
import { NotificationSheet } from "@/components/notifications/notification-sheet";
import { useNotifications } from "@/providers/notification-provider";
import { clearSessionRecord } from "@/lib/auth/session";

export function NavUserSkeleton() {
  return (
    <div className="flex items-center gap-2 p-1">
      <Skeleton className="size-7 rounded-md shrink-0" />
      <div className="flex-1 space-y-1 min-w-0">
        <Skeleton className="h-3 w-20 rounded" />
        <Skeleton className="h-2 w-14 rounded" />
      </div>
    </div>
  );
}

export function NavUser({ userProfile }: { userProfile: UserProfile }) {
  const { isMobile } = useSidebar();
  const router = useRouter();
  const { unreadCount } = useNotifications();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      clearSessionRecord(true);
      if (typeof window !== "undefined") {
        sessionStorage.clear();
      }
      router.push("/auth/login");
      router.refresh();
    } catch (err) {
      console.error("Failed to sign out:", err);
    }
  };

  const initials = userProfile.user_name
    ? userProfile.user_name.slice(0, 2).toUpperCase()
    : "HB";

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <SidebarMenuButton
                  size="lg"
                  className="h-10 rounded-md p-1.5 transition-colors hover:bg-sidebar-accent aria-expanded:bg-sidebar-accent cursor-pointer"
                />
              }
            >
              <div className="relative">
                <Avatar className="size-7 rounded-md border border-sidebar-border">
                  <AvatarImage
                    src={userProfile.avatar_url}
                    alt={userProfile.user_name}
                    className="object-cover"
                  />
                  <AvatarFallback className="rounded-md bg-muted text-foreground font-medium text-[11px]">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                {unreadCount > 0 && (
                  <span
                    className="absolute -top-1 -right-1 flex size-3.5 items-center justify-center rounded-full bg-primary text-[8px] font-bold text-primary-foreground border-2 border-sidebar"
                    aria-label={`${unreadCount} unread notifications`}
                  >
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </div>

              <div className="grid flex-1 text-left text-xs leading-tight min-w-0 ml-1">
                <span className="truncate font-medium text-foreground text-xs">
                  {userProfile.user_name}
                </span>
                <span className="truncate text-[10px] text-muted-foreground font-normal">
                  {userProfile.timezone || "Member"}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-3 text-muted-foreground/60 shrink-0" />
            </DropdownMenuTrigger>

            <DropdownMenuContent
              className="min-w-56 rounded-lg border border-border bg-popover p-1 shadow-md animate-in fade-in zoom-in-98 duration-100"
              side={isMobile ? "bottom" : "right"}
              align="start"
              sideOffset={6}
            >
              <DropdownMenuLabel className="px-2.5 py-1.5 text-[11px] text-muted-foreground font-normal">
                Signed in as <span className="text-foreground font-medium">@{userProfile.user_name}</span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="my-1" />
              <DropdownMenuGroup className="space-y-0.5">
                <DropdownMenuItem
                  onClick={() => setIsProfileOpen(true)}
                  className="h-7.5 px-2 rounded-md text-xs font-medium cursor-pointer transition-colors"
                >
                  <BadgeCheck className="size-3.5 mr-2 text-muted-foreground" />
                  <span>Profile Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setIsNotificationsOpen(true)}
                  className="h-7.5 px-2 rounded-md text-xs font-medium cursor-pointer transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <Bell className="size-3.5 mr-2 text-muted-foreground" />
                    <span>Notifications</span>
                  </div>
                  {unreadCount > 0 && (
                    <span className="ml-auto inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-primary text-primary-foreground leading-none min-w-4">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator className="my-1" />
              <DropdownMenuItem
                onClick={handleLogout}
                className="h-7.5 px-2 rounded-md text-xs font-medium text-destructive hover:bg-destructive/10 hover:text-destructive cursor-pointer transition-colors"
              >
                <LogOut className="size-3.5 mr-2" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <ProfileSettingsModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        userProfile={userProfile}
      />

      <NotificationSheet
        open={isNotificationsOpen}
        onOpenChange={setIsNotificationsOpen}
      />
    </>
  );
}

export default NavUser;
