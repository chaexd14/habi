import { ScheduleItem, DayOfWeek } from "@/types/schedule";

export type ScheduleConflict = {
  id: string;
  title: string;
  schedule_id: string;
  schedule_title?: string;
  overlapping_days: string[];
  start_time: string;
  end_time: string;
};

/**
 * Parse "HH:mm" time string to minutes since midnight.
 */
function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + (m || 0);
}

/**
 * Detect schedule conflicts between a new schedule item and existing items.
 * Two items conflict when they share at least one day AND their time ranges overlap.
 *
 * Time overlap: newStart < existingEnd AND newEnd > existingStart
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
    const sharedDays = existing.days.filter((d) =>
      newItem.days.includes(d)
    );

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
