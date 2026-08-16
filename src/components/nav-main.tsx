"use client"

import * as React from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Calendar } from "@/components/ui/calendar"
import { Skeleton } from "@/components/ui/skeleton"

function getIsoDateString(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = (date.getMonth() + 1).toString().padStart(2, "0");
  const dd = date.getDate().toString().padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function NavMain() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [mounted, setMounted] = React.useState(false);
  const [date, setDate] = React.useState<Date | undefined>(undefined);

  const dateParam = searchParams.get("date");

  React.useEffect(() => {
    setMounted(true);
    if (dateParam) {
      const parsed = new Date(dateParam);
      if (!isNaN(parsed.getTime())) {
        setDate(parsed);
        return;
      }
    }
    setDate(new Date());
  }, [dateParam]);

  const handleSelectDate = (newDate: Date | undefined) => {
    setDate(newDate);
    if (newDate) {
      const iso = getIsoDateString(newDate);
      const params = new URLSearchParams(searchParams.toString());
      params.set("date", iso);
      router.push(`/dashboard?${params.toString()}`);
    }
  };

  if (!mounted) {
    return (
      <div className="w-full max-w-full overflow-hidden p-0.5 group-data-[collapsible=icon]:hidden">
        <Skeleton className="w-full h-64 rounded-xl border border-sidebar-border/50" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-full overflow-hidden p-0.5 group-data-[collapsible=icon]:hidden">
      <div className="w-full max-w-full min-w-0 rounded-xl border border-sidebar-border/70 bg-card/70 backdrop-blur-xs p-1.5 shadow-2xs">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelectDate}
          today={date}
          className="w-full max-w-full min-w-0 p-0.5 [--cell-size:1.75rem]"
        />
      </div>
    </div>
  );
}
