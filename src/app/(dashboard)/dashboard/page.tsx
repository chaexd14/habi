import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

import AppShell from "@/components/common/app-shell";
import { DashboardCalendar } from "@/components/dashboard/dashboard-calendar";

async function DashboardContent() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <div className="flex flex-col gap-4 w-full h-full min-h-[calc(100vh-5rem)]">
      <div className="flex-1 w-full h-full">
        <DashboardCalendar />
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <AppShell>
      <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading dashboard...</div>}>
        <DashboardContent />
      </Suspense>
    </AppShell>
  );
}
