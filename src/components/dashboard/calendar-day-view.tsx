"use client";

import * as React from "react";
import { Category } from "@/types/category";
import { RenderEvent } from "@/components/forms/edit-event-modal";
import { Clock, Repeat } from "lucide-react";
import { computeOverlappingLayout, parseEndTimeToHours } from "@/lib/utils/calendar-layout";

export interface CalendarDayViewProps {
  currentDate: Date;
  timelineHours: string[];
  dynamicHourRange: { minHour: number; maxHour: number };
  HOUR_HEIGHT: number;
  getRenderEventsForDate: (date: Date) => RenderEvent[];
  categoryMap: Map<string, Category>;
  parseTimeToHours: (timeStr?: string | null) => number | null;
  format12h: (hourFloatOrStr?: number | string | null) => string;
  onItemClick: (ev: RenderEvent, e: React.MouseEvent) => void;
}

export function CalendarDayView({
  currentDate,
  timelineHours,
  dynamicHourRange,
  HOUR_HEIGHT,
  getRenderEventsForDate,
  categoryMap,
  parseTimeToHours,
  format12h,
  onItemClick,
}: CalendarDayViewProps) {
  const dayEvents = getRenderEventsForDate(currentDate);
  const positionedEvents = computeOverlappingLayout(
    dayEvents,
    parseTimeToHours,
    dynamicHourRange.minHour
  );

  return (
    <div
      role="region"
      aria-label="Day Calendar Timeline"
      className="flex flex-col h-full min-w-[500px] bg-background select-none"
    >
      <div className="px-4 py-2.5 border-b border-border bg-muted/20 flex items-center justify-between">
        <span className="text-xs font-semibold text-foreground tracking-tight">
          {currentDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
        </span>
        <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-mono">
          <Clock className="size-3 text-muted-foreground/70" aria-hidden="true" />
          <span>{format12h(dynamicHourRange.minHour)} – {format12h(dynamicHourRange.maxHour)}</span>
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="grid grid-cols-[60px_1fr] relative divide-x divide-border">
          {/* Dynamic 12h Time Axis */}
          <div className="divide-y divide-border/60 bg-muted/10">
            {timelineHours.map((hourStr) => (
              <div
                key={hourStr}
                className="px-2 text-[10px] font-mono text-muted-foreground flex items-start justify-end pt-1"
                style={{ height: `${HOUR_HEIGHT}px` }}
              >
                {hourStr}
              </div>
            ))}
          </div>

          {/* Day Column */}
          <div
            className="relative divide-y divide-border/40 bg-card/20"
            style={{ height: `${timelineHours.length * HOUR_HEIGHT}px` }}
          >
            {timelineHours.map((hourStr) => (
              <div
                key={hourStr}
                className="border-b border-border/40 hover:bg-muted/20 transition-colors"
                style={{ height: `${HOUR_HEIGHT}px` }}
              />
            ))}

            {/* Positioned Day Events */}
            {positionedEvents.map(({ event: ev, leftPercent, widthPercent }) => {
              const cat = ev.categoryId ? categoryMap.get(ev.categoryId) : null;

              const startH = parseTimeToHours(ev.startTime) ?? dynamicHourRange.minHour;
              const endH = parseEndTimeToHours(ev.endTime, ev.startTime, parseTimeToHours) ?? (startH + 1);

              const durationHours = Math.max(0.5, endH - startH);
              const topPx = (startH - dynamicHourRange.minHour) * HOUR_HEIGHT;
              const minCardHeight = Math.max(22, Math.round(36 * (HOUR_HEIGHT / 64)));
              const heightPx = Math.max(minCardHeight, durationHours * HOUR_HEIGHT - 3);

              const isSchedule = ev.type === "schedule_item";
              const timeLabel = `${format12h(ev.startTime || startH)} – ${format12h(ev.endTime || endH)}`;

              return (
                <div
                  key={ev.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`${ev.title}, ${timeLabel}${isSchedule ? `, ${ev.scheduleTitle || "Recurring Schedule"}` : ""}`}
                  onClick={(e) => onItemClick(ev, e)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onItemClick(ev, e as unknown as React.MouseEvent);
                    }
                  }}
                  className={`absolute rounded-md border border-border bg-card shadow-2xs transition-colors duration-100 hover:bg-muted/70 hover:z-20 z-10 flex flex-col justify-between cursor-pointer overflow-hidden focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${
                    heightPx < 36 ? "p-1.5 pl-2.5" : "p-2.5 pl-3"
                  }`}
                  style={{
                    top: `${topPx + 2}px`,
                    height: `${heightPx}px`,
                    left: `calc(${leftPercent}% + 3px)`,
                    width: `calc(${widthPercent}% - 6px)`,
                  }}
                >
                  {/* Left Accent Stripe */}
                  <span
                    className="absolute inset-y-0 left-0 w-1 rounded-l-md"
                    style={{
                      backgroundColor: cat?.color || "#71717a",
                    }}
                  />

                  <div className="min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-xs text-foreground flex items-center gap-1.5 truncate tracking-tight">
                        {isSchedule && <Repeat className="size-3 shrink-0 opacity-60 text-muted-foreground" aria-hidden="true" />}
                        <span className="truncate">{ev.title}</span>
                      </span>
                      {heightPx >= 28 && (
                        <span className="text-[10px] font-mono text-muted-foreground px-1.5 py-0.5 rounded bg-muted/60 border border-border/40 shrink-0">
                          {timeLabel}
                        </span>
                      )}
                    </div>

                    {isSchedule && ev.scheduleTitle && heightPx >= 44 && (
                      <div className="mt-0.5 flex items-center">
                        <span className="truncate text-[10px] text-muted-foreground">
                          {ev.scheduleTitle}
                        </span>
                      </div>
                    )}

                    {ev.description && heightPx >= 58 && (
                      <p className="text-[11px] text-muted-foreground font-normal mt-0.5 truncate leading-tight">
                        {ev.description}
                      </p>
                    )}
                  </div>

                  {cat && heightPx >= 40 && (
                    <div className="flex items-center gap-1 mt-1 shrink-0">
                      <span
                        className="size-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: cat.color || "#71717a" }}
                      />
                      <span className="text-[10px] text-muted-foreground truncate">{cat.name}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CalendarDayView;
