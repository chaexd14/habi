"use client"

import React from 'react'
import createClient from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { clearSessionRecord } from '@/lib/auth/session';

export default function LogoutPage() {
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    clearSessionRecord(true);
    if (typeof window !== "undefined") {
      sessionStorage.clear();
    }

    router.push("/auth/login");
    router.refresh();
  }

  return (
    <Button onClick={handleLogout} variant="outline">
      logout
    </Button>
  )
}