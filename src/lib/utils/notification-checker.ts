import { CalendarItem } from "@/types/calendar-item";
import { ScheduleItem, DayOfWeek, Schedule } from "@/types/schedule";
import { NotificationItem, EventSourceType } from "@/types/notification";

const DAY_MAP: Record<number, DayOfWeek> = {
  0: "SUN",
  1: "MON",
  2: "TUE",
  3: "WED",
  4: "THU",
  5: "FRI",
  6: "SAT",
};

export function getIsoDateString(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = (date.getMonth() + 1).toString().padStart(2, "0");
  const dd = date.getDate().toString().padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function parseTimeToMinutes(timeStr?: string | null): number | null {
  if (!timeStr) return null;
  const parts = timeStr.split(":");
  if (parts.length < 2) return null;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m)) return null;
  return h * 60 + m;
}

export function formatTime12h(timeStr?: string | null): string {
  if (!timeStr) return "";
  const parts = timeStr.split(":");
  if (parts.length < 2) return timeStr;
  let h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m)) return timeStr;

  const period = h >= 12 ? "PM" : "AM";
  h = h % 12 === 0 ? 12 : h % 12;
  const padM = m.toString().padStart(2, "0");
  return `${h}:${padM} ${period}`;
}

export interface TodayItem {
  id: string;
  title: string;
  description?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  eventType: EventSourceType;
}

export function getTodayItems(
  calendarItems: CalendarItem[],
  scheduleItems: ScheduleItem[],
  schedules: Schedule[] = [],
  nowDate: Date = new Date()
): TodayItem[] {
  const todayIso = getIsoDateString(nowDate);
  const dayCode = DAY_MAP[nowDate.getDay()];
  const items: TodayItem[] = [];

  const scheduleMap = new Map<string, Schedule>();
  schedules.forEach((sch) => scheduleMap.set(sch.id, sch));

  // Filter calendar items for today
  calendarItems.forEach((c) => {
    if (c.day === todayIso) {
      items.push({
        id: c.id,
        title: c.title,
        description: c.description,
        startTime: c.start_time,
        endTime: c.end_time,
        eventType: "calendar_item",
      });
    }
  });

  // Filter schedule items for today (checking parent schedule start_date and end_date)
  scheduleItems.forEach((s) => {
    if (Array.isArray(s.days) && s.days.includes(dayCode)) {
      const parentSchedule = scheduleMap.get(s.schedule_id);
      if (parentSchedule) {
        if (parentSchedule.start_date && todayIso < parentSchedule.start_date) {
          return;
        }
        if (parentSchedule.end_date && todayIso > parentSchedule.end_date) {
          return;
        }
      }

      items.push({
        id: s.id,
        title: s.title,
        startTime: s.start_time,
        endTime: s.end_time,
        eventType: "schedule_item",
      });
    }
  });

  return items;
}

export interface EvaluateNotificationsResult {
  newNotifications: NotificationItem[];
  notifiedKeys: Set<string>;
}

export function evaluateNotifications(
  calendarItems: CalendarItem[],
  scheduleItems: ScheduleItem[],
  schedules: Schedule[] = [],
  alreadyNotifiedKeys: Set<string>,
  nowDate: Date = new Date()
): EvaluateNotificationsResult {
  const todayIso = getIsoDateString(nowDate);
  const updatedNotifiedKeys = new Set(alreadyNotifiedKeys);
  const newNotifications: NotificationItem[] = [];

  // 1. Check Today Summary Notification
  const todayItems = getTodayItems(calendarItems, scheduleItems, schedules, nowDate);
  const todaySummaryKey = `today_summary_${todayIso}`;
  if (!updatedNotifiedKeys.has(todaySummaryKey)) {
    updatedNotifiedKeys.add(todaySummaryKey);
    if (todayItems.length > 0) {
      const itemNames = todayItems
        .map((i) => (i.startTime ? `${i.title} (${formatTime12h(i.startTime)})` : i.title))
        .join(", ");

      newNotifications.push({
        id: todaySummaryKey,
        type: "today_summary",
        title: "Today's Schedule",
        message: `You have ${todayItems.length} item${todayItems.length === 1 ? "" : "s"} scheduled for today: ${itemNames}`,
        items: todayItems.map((i) => ({
          title: i.title,
          startTime: i.startTime,
          endTime: i.endTime,
        })),
        timestamp: nowDate.toISOString(),
        read: false,
      });
    }
  }

  // 2. Check Upcoming (within 30 mins) & Happening Now for Today & Tomorrow
  const tomorrowDate = new Date(nowDate);
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);

  const datesToCheck = [
    { date: nowDate, items: todayItems },
    { date: tomorrowDate, items: getTodayItems(calendarItems, scheduleItems, schedules, tomorrowDate) },
  ];

  datesToCheck.forEach(({ date, items }) => {
    const iso = getIsoDateString(date);

    items.forEach((item) => {
      if (!item.startTime) return;

      const [sH, sM] = item.startTime.split(":").map((v) => parseInt(v, 10));
      if (isNaN(sH) || isNaN(sM)) return;

      const startDateTime = new Date(date);
      startDateTime.setHours(sH, sM, 0, 0);

      let endDateTime: Date;
      if (item.endTime) {
        const [eH, eM] = item.endTime.split(":").map((v) => parseInt(v, 10));
        endDateTime = new Date(date);
        if (!isNaN(eH) && !isNaN(eM)) {
          endDateTime.setHours(eH, eM, 0, 0);
          if (endDateTime < startDateTime) {
            endDateTime.setDate(endDateTime.getDate() + 1);
          }
        } else {
          endDateTime = new Date(startDateTime.getTime() + 30 * 60000);
        }
      } else {
        endDateTime = new Date(startDateTime.getTime() + 30 * 60000);
      }

      const diffMs = startDateTime.getTime() - nowDate.getTime();
      const minutesUntilStart = Math.floor(diffMs / 60000);

      // 2a. Upcoming 30 minutes before start time (e.g. 10:30 PM for 11:00 PM event)
      const upcomingKey = `upcoming_30m_${item.eventType}_${item.id}_${iso}`;
      if (minutesUntilStart >= 0 && minutesUntilStart <= 30) {
        if (!updatedNotifiedKeys.has(upcomingKey)) {
          updatedNotifiedKeys.add(upcomingKey);
          const timeMsg =
            minutesUntilStart === 0
              ? "starts now"
              : `starts in ${minutesUntilStart} minute${minutesUntilStart === 1 ? "" : "s"}`;
          newNotifications.push({
            id: upcomingKey,
            type: "upcoming_30m",
            title: `Upcoming: ${item.title}`,
            message: `Event ${timeMsg} at ${formatTime12h(item.startTime)}.`,
            eventId: item.id,
            eventType: item.eventType,
            startTime: item.startTime,
            endTime: item.endTime,
            timestamp: nowDate.toISOString(),
            read: false,
          });
        }
      }

      // 2b. Happening Now
      const happeningKey = `happening_now_${item.eventType}_${item.id}_${iso}`;
      if (nowDate.getTime() >= startDateTime.getTime() && nowDate.getTime() <= endDateTime.getTime()) {
        if (!updatedNotifiedKeys.has(happeningKey)) {
          updatedNotifiedKeys.add(happeningKey);
          const endStr = item.endTime ? ` until ${formatTime12h(item.endTime)}` : "";
          newNotifications.push({
            id: happeningKey,
            type: "happening_now",
            title: `Happening Now: ${item.title}`,
            message: `Scheduled from ${formatTime12h(item.startTime)}${endStr}.`,
            eventId: item.id,
            eventType: item.eventType,
            startTime: item.startTime,
            endTime: item.endTime,
            timestamp: nowDate.toISOString(),
            read: false,
          });
        }
      }
    });
  });

  return {
    newNotifications,
    notifiedKeys: updatedNotifiedKeys,
  };
}
