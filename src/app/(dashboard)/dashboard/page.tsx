import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import LogoutPage from "@/app/auth/logout/page";

import AppShell from "@/components/common/app-shell";

export default async function Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <AppShell>
      <h1>
        dashboard
      </h1>
      <LogoutPage />
    </AppShell>
  )
}
