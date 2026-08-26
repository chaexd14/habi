import { Schedule, ScheduleItem, DayOfWeek, ConflictDetail, ScheduleConflict } from "@/types/schedule";
import { CalendarItem } from "@/types/calendar-item";

export type { ConflictDetail, ScheduleConflict } from "@/types/schedule";

const DAY_MAP: Record<number, DayOfWeek> = {
  0: "SUN",
  1: "MON",
  2: "TUE",
  3: "WED",
  4: "THU",
  5: "FRI",
  6: "SAT",
};

/**
 * Parse "HH:mm" time string to minutes since midnight.
 */
export function timeToMinutes(time: string): number {
  if (!time) return 0;
  const [h, m] = time.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

/**
 * Check whether two time ranges overlap.
 * Considers overnight rollover if end time <= start time.
 */
export function doTimeRangesOverlap(
  startAStr?: string | null,
  endAStr?: string | null,
  startBStr?: string | null,
  endBStr?: string | null
): boolean {
  if (!startAStr || !endAStr || !startBStr || !endBStr) {
    // If times are missing, treat as all-day overlap
    return true;
  }

  let startA = timeToMinutes(startAStr);
  let endA = timeToMinutes(endAStr);
  let startB = timeToMinutes(startBStr);
  let endB = timeToMinutes(endBStr);

  if (endA <= startA) endA += 24 * 60;
  if (endB <= startB) endB += 24 * 60;

  return startA < endB && endA > startB;
}

/**
 * Convert a YYYY-MM-DD string or Date object to DayOfWeek ("MON" | ... | "SUN").
 */
export function getDayOfWeek(dateInput: string | Date): DayOfWeek {
  let d: Date;
  if (typeof dateInput === "string") {
    const parts = dateInput.split("-");
    if (parts.length === 3) {
      d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    } else {
      d = new Date(dateInput);
    }
  } else {
    d = dateInput;
  }
  return DAY_MAP[d.getDay()] || "MON";
}

/**
 * Check if a date falls within optional start and end date bounds.
 */
export function isDateInRange(
  dateIso: string,
  startDate?: string | null,
  endDate?: string | null
): boolean {
  if (startDate && dateIso < startDate) return false;
  if (endDate && dateIso > endDate) return false;
  return true;
}

/**
 * Check if two date ranges overlap.
 */
export function doDateRangesOverlap(
  startA?: string | null,
  endA?: string | null,
  startB?: string | null,
  endB?: string | null
): boolean {
  // If either has no boundaries (indefinite), they overlap
  if (!startA && !endA) return true;
  if (!startB && !endB) return true;

  const minA = startA || "1970-01-01";
  const maxA = endA || "9999-12-31";
  const minB = startB || "1970-01-01";
  const maxB = endB || "9999-12-31";

  return minA <= maxB && maxA >= minB;
}

/**
 * Detect conflicts when creating or updating a Schedule Item (Routine).
 * Checks against other schedule items and existing calendar events.
 */
export function detectRoutineConflicts({
  newItem,
  targetSchedule,
  allSchedules = [],
  allScheduleItems = [],
  allCalendarItems = [],
  excludeItemId,
  sameParentOnly = false,
}: {
  newItem: {
    id?: string;
    schedule_id?: string;
    days: DayOfWeek[];
    start_time: string;
    end_time: string;
    title?: string;
  };
  targetSchedule?: Schedule | null;
  allSchedules?: Schedule[];
  allScheduleItems?: ScheduleItem[];
  allCalendarItems?: CalendarItem[];
  excludeItemId?: string;
  sameParentOnly?: boolean;
}): ConflictDetail[] {
  const conflicts: ConflictDetail[] = [];
  const scheduleMap = new Map<string, Schedule>();
  allSchedules.forEach((s) => scheduleMap.set(s.id, s));

  const resolvedTargetSchedule =
    targetSchedule || (newItem.schedule_id ? scheduleMap.get(newItem.schedule_id) : undefined);

  // 1. Check against other Schedule Items
  for (const existing of allScheduleItems) {
    if (!existing.days || !existing.start_time || !existing.end_time) continue;
    if (excludeItemId && existing.id === excludeItemId) continue;
    if (newItem.id && existing.id === newItem.id) continue;

    if (sameParentOnly && newItem.schedule_id && existing.schedule_id !== newItem.schedule_id) {
      continue;
    }

    const existingSchedule = scheduleMap.get(existing.schedule_id);

    // Check if parent schedules overlap in their active date range
    if (
      resolvedTargetSchedule &&
      existingSchedule &&
      !doDateRangesOverlap(
        resolvedTargetSchedule.start_date,
        resolvedTargetSchedule.end_date,
        existingSchedule.start_date,
        existingSchedule.end_date
      )
    ) {
      continue;
    }

    // Check shared days of week
    const sharedDays = existing.days.filter((d) => newItem.days.includes(d));
    if (sharedDays.length === 0) continue;

    // Check time overlap
    if (doTimeRangesOverlap(newItem.start_time, newItem.end_time, existing.start_time, existing.end_time)) {
      const scheduleTitle = existingSchedule?.title || "Other Schedule";
      conflicts.push({
        id: existing.id,
        conflictType: "routine_overlap",
        title: existing.title,
        sourceType: "schedule_item",
        sourceTitle: scheduleTitle,
        scheduleId: existing.schedule_id,
        scheduleTitle,
        days: sharedDays,
        start_time: existing.start_time,
        end_time: existing.end_time,
        message: `Overlaps with routine '${existing.title}' in '${scheduleTitle}' on ${sharedDays.join(", ")} (${existing.start_time} – ${existing.end_time}).`,
      });
    }
  }

  // 2. Check against marked Calendar Items
  if (allCalendarItems && allCalendarItems.length > 0) {
    for (const calItem of allCalendarItems) {
      if (!calItem.day) continue;

      // Check if calendar item falls within the target schedule's date range
      if (
        resolvedTargetSchedule &&
        !isDateInRange(calItem.day, resolvedTargetSchedule.start_date, resolvedTargetSchedule.end_date)
      ) {
        continue;
      }

      const dayOfWeek = getDayOfWeek(calItem.day);
      if (!newItem.days.includes(dayOfWeek)) continue;

      // Check time overlap
      if (
        !calItem.start_time ||
        !calItem.end_time ||
        doTimeRangesOverlap(newItem.start_time, newItem.end_time, calItem.start_time, calItem.end_time)
      ) {
        conflicts.push({
          id: calItem.id,
          conflictType: "routine_vs_calendar",
          title: calItem.title,
          sourceType: "calendar_item",
          sourceTitle: "Calendar Event",
          date: calItem.day,
          start_time: calItem.start_time || "All Day",
          end_time: calItem.end_time || "All Day",
          message: `Conflicts with calendar event '${calItem.title}' on ${calItem.day}${
            calItem.start_time ? ` (${calItem.start_time} – ${calItem.end_time})` : ""
          }.`,
        });
      }
    }
  }

  return conflicts;
}

/**
 * Detect conflicts when creating or updating a Calendar Event.
 * Checks against planned schedules and existing calendar events.
 */
export function detectCalendarEventConflicts({
  newEvent,
  allSchedules = [],
  allScheduleItems = [],
  allCalendarItems = [],
  excludeEventId,
}: {
  newEvent: {
    id?: string;
    day: string;
    start_time?: string | null;
    end_time?: string | null;
    title?: string;
  };
  allSchedules?: Schedule[];
  allScheduleItems?: ScheduleItem[];
  allCalendarItems?: CalendarItem[];
  excludeEventId?: string;
}): ConflictDetail[] {
  const conflicts: ConflictDetail[] = [];
  const eventDayOfWeek = getDayOfWeek(newEvent.day);
  const scheduleMap = new Map<string, Schedule>();
  allSchedules.forEach((s) => scheduleMap.set(s.id, s));

  // 1. Check against Planned Schedules and Active Routines
  for (const sItem of allScheduleItems) {
    if (!sItem.days || !Array.isArray(sItem.days) || !sItem.days.includes(eventDayOfWeek)) {
      continue;
    }

    const sch = scheduleMap.get(sItem.schedule_id);
    // Check if the schedule is active on this day
    if (sch && !isDateInRange(newEvent.day, sch.start_date, sch.end_date)) {
      continue;
    }

    // Check time overlap
    if (
      !newEvent.start_time ||
      !newEvent.end_time ||
      doTimeRangesOverlap(newEvent.start_time, newEvent.end_time, sItem.start_time, sItem.end_time)
    ) {
      const isPlanned = Boolean(sch?.start_date || sch?.end_date);
      const scheduleTitle = sch?.title || "Recurring Schedule";

      conflicts.push({
        id: sItem.id,
        conflictType: "calendar_vs_routine",
        title: sItem.title,
        sourceType: "schedule_item",
        sourceTitle: `${scheduleTitle}${isPlanned ? " (Planned Schedule)" : ""}`,
        scheduleId: sItem.schedule_id,
        scheduleTitle,
        date: newEvent.day,
        days: sItem.days,
        start_time: sItem.start_time,
        end_time: sItem.end_time,
        message: isPlanned
          ? `User has a planned schedule on that day: '${scheduleTitle}' - '${sItem.title}' (${sItem.start_time} – ${sItem.end_time}).`
          : `Overlaps with routine '${sItem.title}' in '${scheduleTitle}' on ${newEvent.day} (${sItem.start_time} – ${sItem.end_time}).`,
      });
    }
  }

  // 2. Check against other Calendar Events on the same day
  for (const existingCal of allCalendarItems) {
    if (excludeEventId && existingCal.id === excludeEventId) continue;
    if (newEvent.id && existingCal.id === newEvent.id) continue;
    if (existingCal.day !== newEvent.day) continue;

    if (
      !newEvent.start_time ||
      !newEvent.end_time ||
      !existingCal.start_time ||
      !existingCal.end_time ||
      doTimeRangesOverlap(newEvent.start_time, newEvent.end_time, existingCal.start_time, existingCal.end_time)
    ) {
      conflicts.push({
        id: existingCal.id,
        conflictType: "calendar_vs_calendar",
        title: existingCal.title,
        sourceType: "calendar_item",
        sourceTitle: "Calendar Event",
        date: existingCal.day,
        start_time: existingCal.start_time || "All Day",
        end_time: existingCal.end_time || "All Day",
        message: `Conflicts with existing calendar event '${existingCal.title}' on this day${
          existingCal.start_time ? ` (${existingCal.start_time} – ${existingCal.end_time})` : ""
        }.`,
      });
    }
  }

  return conflicts;
}

/**
 * Backward-compatible wrapper for legacy detectScheduleConflicts.
 */
export function detectScheduleConflicts(
  newItem: {
    schedule_id?: string;
    days: DayOfWeek[];
    start_time: string;
    end_time: string;
  },
  existingItems: ScheduleItem[],
  scheduleNameMap?: Map<string, string>,
  excludeItemId?: string,
  sameParentOnly: boolean = true
): ScheduleConflict[] {
  const newStart = timeToMinutes(newItem.start_time);
  const newEnd = timeToMinutes(newItem.end_time);

  const conflicts: ScheduleConflict[] = [];

  for (const existing of existingItems) {
    if (!existing.days || !existing.start_time || !existing.end_time) continue;

    // Skip self during updates
    if (excludeItemId && existing.id === excludeItemId) continue;

    // Filter by same parent schedule if sameParentOnly is enabled
    if (sameParentOnly && newItem.schedule_id && existing.schedule_id !== newItem.schedule_id) {
      continue;
    }

    // Find shared days
    const sharedDays = existing.days.filter((d) => newItem.days.includes(d));
    if (sharedDays.length === 0) continue;

    // Check time overlap
    const existStart = timeToMinutes(existing.start_time);
    const existEnd = timeToMinutes(existing.end_time);

    if (newStart < existEnd && newEnd > existStart) {
      conflicts.push({
        id: existing.id,
        title: existing.title,
        schedule_id: existing.schedule_id,
        schedule_title: scheduleNameMap?.get(existing.schedule_id) || undefined,
        overlapping_days: sharedDays,
        start_time: existing.start_time,
        end_time: existing.end_time,
      });
    }
  }

  return conflicts;
}

