import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { NotificationBell } from "@/components/common/notification-bell"

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-background">
        <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between gap-2 px-4 sm:px-6 backdrop-blur-md bg-background/85 border-b border-border/60 transition-colors">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors" />
            <Separator
              orientation="vertical"
              className="h-4 bg-border/60"
            />
            <Breadcrumb>
              <BreadcrumbList className="text-xs font-medium">
                <BreadcrumbItem className="hidden sm:block">
                  <BreadcrumbLink href="/dashboard" className="text-muted-foreground/80 hover:text-foreground transition-colors">
                    Dashboard
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden sm:block text-muted-foreground/40" />
                <BreadcrumbItem>
                  <BreadcrumbPage className="font-semibold text-foreground">Schedule & Calendar</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
          </div>
        </header>
        <main className="flex flex-1 flex-col p-4 sm:p-6 pt-3">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
