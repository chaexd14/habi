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
    <div className="flex flex-col h-full min-w-[500px] bg-background select-none">
      <div className="px-4 py-3 border-b border-border/70 bg-muted/20 flex items-center justify-between">
        <span className="text-sm font-bold text-foreground tracking-tight">
          {currentDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
        </span>
        <span className="text-xs text-muted-foreground flex items-center gap-1.5 font-mono">
          <Clock className="size-3.5 text-muted-foreground/80" />
          <span>Timeline: {format12h(dynamicHourRange.minHour)} – {format12h(dynamicHourRange.maxHour)}</span>
        </span>
      </div>

      <div className="flex-1 overflow-y-auto max-h-[600px]">
        <div className="grid grid-cols-[72px_1fr] relative divide-x divide-border/60">
          {/* Dynamic 12h Time Axis */}
          <div className="divide-y divide-border/50 bg-muted/[0.12]">
            {timelineHours.map((hourStr) => (
              <div
                key={hourStr}
                className="px-2.5 text-xs font-mono font-medium text-muted-foreground/75 flex items-start justify-end pt-1"
                style={{ height: `${HOUR_HEIGHT}px` }}
              >
                {hourStr}
              </div>
            ))}
          </div>

          {/* Day Column */}
          <div
            className="relative divide-y divide-border/40 bg-card/30"
            style={{ height: `${timelineHours.length * HOUR_HEIGHT}px` }}
          >
            {timelineHours.map((hourStr) => (
              <div
                key={hourStr}
                className="border-b border-border/30 hover:bg-muted/[0.12] transition-colors"
                style={{ height: `${HOUR_HEIGHT}px` }}
              />
            ))}

            {/* Resized & Positioned Day Events */}
            {positionedEvents.map(({ event: ev, leftPercent, widthPercent }) => {
              const cat = ev.categoryId ? categoryMap.get(ev.categoryId) : null;

              const startH = parseTimeToHours(ev.startTime) ?? dynamicHourRange.minHour;
              const endH = parseEndTimeToHours(ev.endTime, ev.startTime, parseTimeToHours) ?? (startH + 1);

              const durationHours = Math.max(0.5, endH - startH);
              const topPx = (startH - dynamicHourRange.minHour) * HOUR_HEIGHT;
              const heightPx = Math.max(44, durationHours * HOUR_HEIGHT - 4);

              const isSchedule = ev.type === "schedule_item";

              return (
                <div
                  key={ev.id}
                  onClick={(e) => onItemClick(ev, e)}
                  className="absolute p-3 rounded-xl border shadow-2xs transition-all duration-150 hover:shadow-sm hover:z-20 z-10 flex flex-col justify-between cursor-pointer overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  style={{
                    top: `${topPx + 2}px`,
                    height: `${heightPx}px`,
                    left: `calc(${leftPercent}% + 4px)`,
                    width: `calc(${widthPercent}% - 8px)`,
                    backgroundColor: cat?.color ? `${cat.color}18` : "#3b82f618",
                    color: cat?.color || "#3b82f6",
                    borderColor: cat?.color ? `${cat.color}45` : "#3b82f645",
                  }}
                >
                  <div className="min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className="font-bold text-sm flex items-center gap-1.5 truncate tracking-tight"
                        style={{ color: cat?.color || "inherit" }}
                      >
                        {isSchedule && <Repeat className="size-3.5 shrink-0 opacity-80" style={{ color: cat?.color || "currentColor" }} />}
                        <span className="truncate">{ev.title}</span>
                      </span>
                      <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-md bg-background/80 shadow-2xs border border-border/40 text-foreground shrink-0">
                        {format12h(ev.startTime || startH)} – {format12h(ev.endTime || endH)}
                      </span>
                    </div>

                    {isSchedule && ev.scheduleTitle && (
                      <div className="mt-1 flex items-center">
                        <span className="truncate text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                          {ev.scheduleTitle}
                        </span>
                      </div>
                    )}

                    {ev.description && (
                      <p className="text-xs opacity-75 font-normal mt-1 leading-relaxed truncate">
                        {ev.description}
                      </p>
                    )}
                  </div>

                  {cat && (
                    <div className="flex items-center gap-1.5 mt-2 shrink-0">
                      <span
                        className="size-2 rounded-full shrink-0"
                        style={{ backgroundColor: cat.color || "#3b82f6" }}
                      />
                      <span className="text-xs font-semibold opacity-90 truncate">{cat.name}</span>
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
