"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Schedule } from "@/types/schedule";
import { getSchedules } from "@/lib/api/schedule";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Repeat, ChevronRight, CalendarRange } from "lucide-react";

import { AddScheduleModal } from "@/components/forms/add-schedule-modal";

export interface NavScheduleProps extends React.ComponentPropsWithoutRef<typeof SidebarGroup> {
  schedules?: Schedule[];
  activeScheduleId?: string;
  onSelectSchedule?: (schedule: Schedule) => void;
  onScheduleCreated?: (schedule: Schedule) => void;
}

export function NavSchedule({
  schedules: initialSchedules,
  activeScheduleId,
  onSelectSchedule,
  onScheduleCreated,
  className,
  ...props
}: NavScheduleProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [schedules, setSchedules] = useState<Schedule[]>(initialSchedules || []);
  const [loading, setLoading] = useState(!initialSchedules);
  const [error, setError] = useState<string | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const currentScheduleId = searchParams.get("scheduleId") || activeScheduleId || "";

  useEffect(() => {
    if (initialSchedules) {
      setSchedules(initialSchedules);
      setLoading(false);
      return;
    }

    async function fetchUserSchedules() {
      try {
        setLoading(true);
        const res = await getSchedules();
        if (res.success && Array.isArray(res.data)) {
          setSchedules(res.data);
        }
      } catch (err) {
        console.error("Failed to load schedules:", err);
        setError(err instanceof Error ? err.message : "Failed to load schedules");
      } finally {
        setLoading(false);
      }
    }

    fetchUserSchedules();
  }, [initialSchedules]);

  const handleScheduleCreated = (newSchedule: Schedule) => {
    setSchedules((prev) => [...prev, newSchedule]);
    if (onScheduleCreated) {
      onScheduleCreated(newSchedule);
    }
  };

  const handleSelectSchedule = (sched: Schedule) => {
    if (onSelectSchedule) {
      onSelectSchedule(sched);
    }
    const params = new URLSearchParams(searchParams.toString());
    params.set("type", "schedule");

    if (currentScheduleId === sched.id) {
      params.delete("scheduleId");
    } else {
      params.set("scheduleId", sched.id);
    }

    router.push(`/dashboard?${params.toString()}`);
  };

  return (
    <>
      <Collapsible defaultOpen className="group/collapsible w-full">
        <SidebarGroup className={className} {...props}>
          <SidebarGroupLabel className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground/75 px-2 mb-1">
            <CollapsibleTrigger className="flex items-center gap-1.5 flex-1 cursor-pointer select-none text-left py-1 hover:text-foreground transition-colors">
              <ChevronRight className="size-3.5 shrink-0 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 text-muted-foreground/60" />
              <Repeat className="size-3.5 shrink-0 text-blue-500" />
              <span>Schedules</span>
            </CollapsibleTrigger>

            <button
              type="button"
              title="Add Schedule"
              onClick={(e) => {
                e.stopPropagation();
                setIsAddOpen(true);
              }}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors"
            >
              <Plus className="size-3.5" />
              <span className="sr-only">Add Schedule</span>
            </button>
          </SidebarGroupLabel>

          <CollapsibleContent>
            <SidebarGroupContent className="mt-0.5">
              {loading ? (
                <div className="space-y-1.5 px-2 py-1">
                  <Skeleton className="h-6 w-full rounded-md" />
                  <Skeleton className="h-6 w-3/4 rounded-md" />
                </div>
              ) : error ? (
                <div className="px-2 py-1 text-xs text-destructive">
                  Failed to load schedules
                </div>
              ) : schedules.length === 0 ? (
                <div className="px-2.5 py-2 text-xs text-muted-foreground italic flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[11px]">
                    <CalendarRange className="size-3 opacity-60" />
                    No schedules yet
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsAddOpen(true)}
                    className="text-primary font-medium hover:underline not-italic text-[11px]"
                  >
                    + Create
                  </button>
                </div>
              ) : (
                <SidebarMenu className="space-y-0.5">
                  {schedules.map((schedule) => {
                    const isActive = currentScheduleId === schedule.id;
                    return (
                      <SidebarMenuItem key={schedule.id}>
                        <SidebarMenuButton
                          size="sm"
                          isActive={isActive}
                          onClick={() => handleSelectSchedule(schedule)}
                          className="group/sch flex items-center justify-between rounded-lg h-7.5 px-2 text-xs font-medium transition-colors hover:bg-sidebar-accent"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="size-2 rounded-full bg-blue-500 shrink-0 shadow-2xs" />
                            <span className="truncate text-xs font-medium">
                              {schedule.title}
                            </span>
                          </div>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              )}
            </SidebarGroupContent>
          </CollapsibleContent>
        </SidebarGroup>
      </Collapsible>

      <AddScheduleModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onScheduleCreated={handleScheduleCreated}
      />
    </>
  );
}

export default NavSchedule;
