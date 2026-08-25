"use client";

import * as React from "react";
import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CalendarItem } from "@/types/calendar-item";
import { Schedule, ScheduleItem, DayOfWeek } from "@/types/schedule";
import { Category } from "@/types/category";

import { getCalendarItems } from "@/lib/api/calendar-item";
import { getSchedules } from "@/lib/api/schedule";
import { getScheduleItems } from "@/lib/api/schedule-item";
import { getCategories } from "@/lib/api/category";

import { Skeleton } from "@/components/ui/skeleton";

import { CalendarToolbar, ViewMode, SourceFilter } from "./calendar-toolbar";
import { CalendarMonthView } from "./calendar-month-view";
import { CalendarWeekView } from "./calendar-week-view";
import { CalendarDayView } from "./calendar-day-view";
import { AddEventModal } from "@/components/forms/add-event-modal";
import { AddScheduleModal } from "@/components/forms/add-schedule-modal";
import { EditEventModal, RenderEvent } from "@/components/forms/edit-event-modal";

const DAY_MAP: Record<number, DayOfWeek> = {
  0: "SUN",
  1: "MON",
  2: "TUE",
  3: "WED",
  4: "THU",
  5: "FRI",
  6: "SAT",
};

const HOUR_HEIGHT = 64; // Height per hour in pixels

function getIsoDateString(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = (date.getMonth() + 1).toString().padStart(2, "0");
  const dd = date.getDate().toString().padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function parseTimeToHours(timeStr?: string | null): number | null {
  if (!timeStr) return null;
  const parts = timeStr.split(":");
  if (parts.length < 2) return null;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m)) return null;
  return h + m / 60;
}

function format12h(hourFloatOrStr?: number | string | null): string {
  if (hourFloatOrStr === null || hourFloatOrStr === undefined) return "";

  let h = 0;
  let m = 0;

  if (typeof hourFloatOrStr === "string") {
    const parts = hourFloatOrStr.split(":");
    if (parts.length >= 2) {
      h = parseInt(parts[0], 10);
      m = parseInt(parts[1], 10);
    } else {
      return hourFloatOrStr;
    }
  } else {
    h = Math.floor(hourFloatOrStr);
    m = Math.round((hourFloatOrStr - Math.floor(hourFloatOrStr)) * 60);
  }

  if (isNaN(h)) return "";
  if (isNaN(m)) m = 0;

  const displayH = h % 24;
  const period = displayH >= 12 ? "PM" : "AM";
  const h12 = displayH % 12 === 0 ? 12 : displayH % 12;
  const padM = m.toString().padStart(2, "0");

  return `${h12}:${padM} ${period}`;
}

function parseEndTimeToHours(endTimeStr?: string | null, startTimeStr?: string | null): number | null {
  if (!endTimeStr) return null;
  let endH = parseTimeToHours(endTimeStr);
  if (endH === null) return null;
  const startH = parseTimeToHours(startTimeStr);
  if (endH === 0 || (startH !== null && endH < startH)) {
    endH += 24;
  }
  return endH;
}

function getDynamicTimelineRange(events: RenderEvent[]): { minHour: number; maxHour: number } {
  let minH = 8;
  let maxH = 16; // Default 8 hours (8:00 AM - 4:00 PM)

  if (events.length > 0) {
    let earliest = 24;
    let latest = 0;

    events.forEach((ev) => {
      const s = parseTimeToHours(ev.startTime);
      const e = parseEndTimeToHours(ev.endTime, ev.startTime);

      if (s !== null) {
        earliest = Math.min(earliest, s);
      }
      if (e !== null) {
        latest = Math.max(latest, e);
      } else if (s !== null) {
        latest = Math.max(latest, s + 1);
      }
    });

    if (earliest < 24) {
      minH = Math.max(0, Math.floor(earliest));
      const targetMax = Math.max(minH + 8, Math.ceil(latest));
      maxH = Math.min(30, targetMax);
    }
  }

  return { minHour: minH, maxHour: maxH };
}

function formatDisplayDate(date: Date, viewMode: ViewMode): string {
  if (viewMode === "month") {
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  } else if (viewMode === "day") {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } else {
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - day);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);

    const startMonth = startOfWeek.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const endMonth = endOfWeek.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return `${startMonth} – ${endMonth}, ${endOfWeek.getFullYear()}`;
  }
}

export function DashboardCalendar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [mounted, setMounted] = useState(false);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("month");

  // URL Query String State
  const urlTypeParam = (searchParams.get("type") as SourceFilter) || "all";
  const urlScheduleIdParam = searchParams.get("scheduleId") || "ALL";
  const urlCategoryIdParam = searchParams.get("categoryId") || "ALL";
  const urlDateParam = searchParams.get("date");

  const [sourceFilter, setSourceFilter] = useState<SourceFilter>(
    ["all", "calendar", "schedule"].includes(urlTypeParam) ? urlTypeParam : "all"
  );
  const [selectedScheduleFilter, setSelectedScheduleFilter] = useState<string>(urlScheduleIdParam);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>(urlCategoryIdParam);

  useEffect(() => {
    if (["all", "calendar", "schedule"].includes(urlTypeParam)) {
      const filter = urlTypeParam as SourceFilter;
      setSourceFilter(filter);
      if (filter === "calendar") {
        setViewMode("month");
      } else if (filter === "schedule" && viewMode === "month") {
        setViewMode("week");
      }
    }
  }, [urlTypeParam]);

  useEffect(() => {
    setSelectedScheduleFilter(urlScheduleIdParam);
  }, [urlScheduleIdParam]);

  useEffect(() => {
    setSelectedCategoryFilter(urlCategoryIdParam);
  }, [urlCategoryIdParam]);

  useEffect(() => {
    if (urlDateParam) {
      const parsed = new Date(urlDateParam);
      if (!isNaN(parsed.getTime())) {
        setCurrentDate(parsed);
        if (sourceFilter === "schedule") {
          setViewMode("day");
        }
      }
    }
  }, [urlDateParam, sourceFilter]);

  // Data states
  const [calendarItems, setCalendarItems] = useState<CalendarItem[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Add & Edit Modal State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isAddScheduleOpen, setIsAddScheduleOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RenderEvent | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    async function loadData() {
      try {
        setLoading(true);
        const [calRes, schedRes, schedItemsRes, catRes] = await Promise.all([
          getCalendarItems(),
          getSchedules(),
          getScheduleItems(),
          getCategories(),
        ]);

        if (calRes.success && Array.isArray(calRes.data)) {
          setCalendarItems(calRes.data);
        }
        if (schedRes.success && Array.isArray(schedRes.data)) {
          setSchedules(schedRes.data);
        }
        if (schedItemsRes.success && Array.isArray(schedItemsRes.data)) {
          setScheduleItems(schedItemsRes.data);
        }
        if (catRes.success && Array.isArray(catRes.data)) {
          setCategories(catRes.data);
        }
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [mounted]);

  // Lookup maps
  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>();
    categories.forEach((cat) => map.set(cat.id, cat));
    return map;
  }, [categories]);

  const scheduleMap = useMemo(() => {
    const map = new Map<string, Schedule>();
    schedules.forEach((sch) => map.set(sch.id, sch));
    return map;
  }, [schedules]);

  // Filter Change Handlers
  const handleFilterChange = (filter: SourceFilter) => {
    setSourceFilter(filter);
    if (filter === "calendar") {
      setViewMode("month");
    } else if (filter === "schedule" && viewMode === "month") {
      setViewMode("week");
    }
    const params = new URLSearchParams(searchParams.toString());
    params.set("type", filter);
    router.push(`/dashboard?${params.toString()}`);
  };

  const handleScheduleFilterChange = (schedId: string) => {
    setSelectedScheduleFilter(schedId);
    const params = new URLSearchParams(searchParams.toString());
    if (schedId === "ALL") {
      params.delete("scheduleId");
    } else {
      params.set("scheduleId", schedId);
    }
    router.push(`/dashboard?${params.toString()}`);
  };

  // Compute rendered events
  const getRenderEventsForDate = React.useCallback(
    (targetDate: Date): RenderEvent[] => {
      const iso = getIsoDateString(targetDate);
      const dayCode = DAY_MAP[targetDate.getDay()];

      const result: RenderEvent[] = [];

      if (sourceFilter === "all" || sourceFilter === "calendar") {
        calendarItems.forEach((cItem) => {
          if (selectedCategoryFilter !== "ALL" && cItem.category_id !== selectedCategoryFilter) {
            return;
          }
          if (cItem.day === iso) {
            result.push({
              id: `cal-${cItem.id}`,
              rawId: cItem.id,
              type: "calendar_item",
              title: cItem.title,
              description: cItem.description,
              dateIso: iso,
              startTime: cItem.start_time,
              endTime: cItem.end_time,
              categoryId: cItem.category_id,
            });
          }
        });
      }

      if (sourceFilter === "all" || sourceFilter === "schedule") {
        scheduleItems.forEach((sItem) => {
          if (selectedScheduleFilter !== "ALL" && sItem.schedule_id !== selectedScheduleFilter) {
            return;
          }
          if (selectedCategoryFilter !== "ALL" && sItem.category_id !== selectedCategoryFilter) {
            return;
          }

          if (Array.isArray(sItem.days) && sItem.days.includes(dayCode)) {
            const sch = scheduleMap.get(sItem.schedule_id);
            result.push({
              id: `sched-${sItem.id}-${iso}`,
              rawId: sItem.id,
              type: "schedule_item",
              title: sItem.title,
              dateIso: iso,
              startTime: sItem.start_time,
              endTime: sItem.end_time,
              categoryId: sItem.category_id,
              scheduleId: sItem.schedule_id,
              scheduleTitle: sch?.title || "Recurring Schedule",
            });
          }
        });
      }

      return result;
    },
    [calendarItems, scheduleItems, scheduleMap, sourceFilter, selectedScheduleFilter, selectedCategoryFilter]
  );

  // Month Grid Days
  const monthDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const startDayOfWeek = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();

    const days: Array<{ date: Date; isCurrentMonth: boolean; iso: string }> = [];

    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i);
      days.push({ date: prevDate, isCurrentMonth: false, iso: getIsoDateString(prevDate) });
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const currDate = new Date(year, month, i);
      days.push({ date: currDate, isCurrentMonth: true, iso: getIsoDateString(currDate) });
    }

    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const nextDate = new Date(year, month + 1, i);
      days.push({ date: nextDate, isCurrentMonth: false, iso: getIsoDateString(nextDate) });
    }

    return days;
  }, [currentDate]);

  // Week Days
  const weekDays = useMemo(() => {
    const startOfWeek = new Date(currentDate);
    const dayOfWeek = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek);

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(d.getDate() + i);
      return { date: d, iso: getIsoDateString(d) };
    });
  }, [currentDate]);

  // Dynamic Hour Range
  const visibleEventsForRange = useMemo(() => {
    if (viewMode === "week") {
      return weekDays.flatMap((w) => getRenderEventsForDate(w.date));
    } else if (viewMode === "day") {
      return getRenderEventsForDate(currentDate);
    }
    return [];
  }, [viewMode, weekDays, currentDate, getRenderEventsForDate]);

  const dynamicHourRange = useMemo(() => {
    return getDynamicTimelineRange(visibleEventsForRange);
  }, [visibleEventsForRange]);

  const timelineHours = useMemo(() => {
    const list: string[] = [];
    for (let h = dynamicHourRange.minHour; h <= dynamicHourRange.maxHour; h++) {
      list.push(format12h(h));
    }
    return list;
  }, [dynamicHourRange]);

  // Navigation handlers
  const updateDateParam = (newDate: Date) => {
    const iso = getIsoDateString(newDate);
    const params = new URLSearchParams(searchParams.toString());
    params.set("date", iso);
    router.push(`/dashboard?${params.toString()}`);
  };

  const handlePrev = () => {
    const next = new Date(currentDate);
    if (viewMode === "month") {
      next.setMonth(next.getMonth() - 1);
    } else if (viewMode === "week") {
      next.setDate(next.getDate() - 7);
    } else {
      next.setDate(next.getDate() - 1);
    }
    setCurrentDate(next);
    updateDateParam(next);
  };

  const handleNext = () => {
    const next = new Date(currentDate);
    if (viewMode === "month") {
      next.setMonth(next.getMonth() + 1);
    } else if (viewMode === "week") {
      next.setDate(next.getDate() + 7);
    } else {
      next.setDate(next.getDate() + 1);
    }
    setCurrentDate(next);
    updateDateParam(next);
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    updateDateParam(today);
  };

  const handleItemClick = (ev: RenderEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingItem(ev);
    setIsEditOpen(true);
  };

  if (!mounted) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-14 w-full rounded-2xl" />
        <Skeleton className="h-[600px] w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-card rounded-xl border border-border shadow-2xs overflow-hidden transition-colors">
      <CalendarToolbar
        currentDate={currentDate}
        viewMode={viewMode}
        sourceFilter={sourceFilter}
        schedules={schedules}
        selectedScheduleFilter={selectedScheduleFilter}
        onPrev={handlePrev}
        onNext={handleNext}
        onToday={handleToday}
        onFilterChange={handleFilterChange}
        onScheduleFilterChange={handleScheduleFilterChange}
        onViewModeChange={setViewMode}
        onOpenAddModal={() => setIsAddOpen(true)}
        formatDisplayDate={formatDisplayDate}
      />

      <div className="flex-1 overflow-auto bg-background/20">
        {loading ? (
          <div className="p-4 space-y-3">
            <Skeleton className="h-80 w-full rounded-lg" />
          </div>
        ) : viewMode === "month" ? (
          <CalendarMonthView
            monthDays={monthDays}
            getRenderEventsForDate={getRenderEventsForDate}
            categoryMap={categoryMap}
            getIsoDateString={getIsoDateString}
            onSelectDate={(d) => {
              setCurrentDate(d);
              updateDateParam(d);
            }}
            onItemClick={handleItemClick}
          />
        ) : viewMode === "week" ? (
          <CalendarWeekView
            weekDays={weekDays}
            timelineHours={timelineHours}
            dynamicHourRange={dynamicHourRange}
            HOUR_HEIGHT={HOUR_HEIGHT}
            sourceFilter={sourceFilter}
            getRenderEventsForDate={getRenderEventsForDate}
            categoryMap={categoryMap}
            getIsoDateString={getIsoDateString}
            parseTimeToHours={parseTimeToHours}
            format12h={format12h}
            onItemClick={handleItemClick}
          />
        ) : (
          <CalendarDayView
            currentDate={currentDate}
            timelineHours={timelineHours}
            dynamicHourRange={dynamicHourRange}
            HOUR_HEIGHT={HOUR_HEIGHT}
            getRenderEventsForDate={getRenderEventsForDate}
            categoryMap={categoryMap}
            parseTimeToHours={parseTimeToHours}
            format12h={format12h}
            onItemClick={handleItemClick}
          />
        )}
      </div>

      <AddEventModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        schedules={schedules}
        categories={categories}
        initialDayIso={getIsoDateString(currentDate)}
        onCalendarItemCreated={(newItem) => setCalendarItems((prev) => [...prev, newItem])}
        onScheduleCreated={(newSched) => setSchedules((prev) => [...prev, newSched])}
        onScheduleItemCreated={(newItem) => setScheduleItems((prev) => [...prev, newItem])}
        onOpenCreateSchedule={() => setIsAddScheduleOpen(true)}
      />

      <AddScheduleModal
        isOpen={isAddScheduleOpen}
        onClose={() => setIsAddScheduleOpen(false)}
        onScheduleCreated={(newSched) => setSchedules((prev) => [...prev, newSched])}
      />

      <EditEventModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        item={editingItem}
        scheduleItems={scheduleItems}
        schedules={schedules}
        categories={categories}
        onCalendarItemUpdated={(updated) =>
          setCalendarItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)))
        }
        onCalendarItemDeleted={(deletedId) =>
          setCalendarItems((prev) => prev.filter((i) => i.id !== deletedId))
        }
        onScheduleItemUpdated={(updated) =>
          setScheduleItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)))
        }
        onScheduleItemDeleted={(deletedId) =>
          setScheduleItems((prev) => prev.filter((i) => i.id !== deletedId))
        }
      />
    </div>
  );
}

export default DashboardCalendar;
