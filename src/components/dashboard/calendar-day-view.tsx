"use client";

import * as React from "react";
import { Category } from "@/types/category";
import { RenderEvent } from "@/components/forms/edit-event-modal";
import { Clock, Repeat } from "lucide-react";

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
  return (
    <div className="flex flex-col h-full min-w-[500px]">
      <div className="p-3 border-b border-border bg-muted/20 flex items-center justify-between">
        <span className="text-sm font-bold text-foreground">
          {currentDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
        </span>
        <span className="text-xs text-muted-foreground flex items-center gap-1 font-mono">
          <Clock className="size-3.5" /> Timeline ({format12h(dynamicHourRange.minHour)} - {format12h(dynamicHourRange.maxHour)})
        </span>
      </div>

      <div className="flex-1 overflow-y-auto max-h-[600px]">
        <div className="grid grid-cols-[80px_1fr] relative divide-x divide-border">
          {/* Dynamic 12h Time Axis */}
          <div className="divide-y divide-border bg-muted/10">
            {timelineHours.map((hourStr) => (
              <div
                key={hourStr}
                className="px-3 text-xs font-mono text-muted-foreground flex items-start justify-end pt-1"
                style={{ height: `${HOUR_HEIGHT}px` }}
              >
                {hourStr}
              </div>
            ))}
          </div>

          {/* Day Column */}
          <div
            className="relative divide-y divide-border bg-card"
            style={{ height: `${timelineHours.length * HOUR_HEIGHT}px` }}
          >
            {timelineHours.map((hourStr) => (
              <div
                key={hourStr}
                className="border-b border-border/40 hover:bg-muted/10 transition-colors"
                style={{ height: `${HOUR_HEIGHT}px` }}
              />
            ))}

            {/* Resized & Positioned Day Events */}
            {getRenderEventsForDate(currentDate).map((ev) => {
              const cat = ev.categoryId ? categoryMap.get(ev.categoryId) : null;

              const startH = parseTimeToHours(ev.startTime) ?? dynamicHourRange.minHour;
              const endH = parseTimeToHours(ev.endTime) ?? (startH + 1);

              const durationHours = Math.max(0.5, endH - startH);
              const topPx = (startH - dynamicHourRange.minHour) * HOUR_HEIGHT;
              const heightPx = Math.max(44, durationHours * HOUR_HEIGHT - 4);

              const isSchedule = ev.type === "schedule_item";

              return (
                <div
                  key={ev.id}
                  onClick={(e) => onItemClick(ev, e)}
                  className="absolute inset-x-3 p-3 rounded-xl border shadow-sm transition-all hover:shadow-md hover:z-20 z-10 flex flex-col justify-between cursor-pointer"
                  style={{
                    top: `${topPx + 2}px`,
                    height: `${heightPx}px`,
                    backgroundColor: cat?.color ? `${cat.color}25` : "#3b82f625",
                    color: cat?.color || "#3b82f6",
                    borderColor: cat?.color || "#3b82f6",
                  }}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-sm flex items-center gap-1.5">
                        {isSchedule && <Repeat className="size-3.5 text-primary" />}
                        {ev.title}
                      </span>
                      <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-background/80 shadow-2xs">
                        {format12h(ev.startTime || startH)} - {format12h(ev.endTime || endH)}
                      </span>
                    </div>
                    {isSchedule && ev.scheduleTitle && (
                      <p className="text-xs opacity-75 font-medium mt-1">{ev.scheduleTitle}</p>
                    )}
                    {ev.description && (
                      <p className="text-xs opacity-80 font-normal mt-1 leading-relaxed">
                        {ev.description}
                      </p>
                    )}
                  </div>

                  {cat && (
                    <div className="flex items-center gap-1.5 mt-2">
                      <span
                        className="size-2 rounded-full"
                        style={{ backgroundColor: cat.color || "#3b82f6" }}
                      />
                      <span className="text-xs font-semibold opacity-90">{cat.name}</span>
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
