"use client";

import * as React from "react";
import { Category } from "@/types/category";
import { RenderEvent } from "@/components/forms/edit-event-modal";
import { Clock, Repeat } from "lucide-react";
import { SourceFilter } from "./calendar-toolbar";

export interface CalendarWeekViewProps {
  weekDays: Array<{ date: Date; iso: string }>;
  timelineHours: string[];
  dynamicHourRange: { minHour: number; maxHour: number };
  HOUR_HEIGHT: number;
  sourceFilter: SourceFilter;
  getRenderEventsForDate: (date: Date) => RenderEvent[];
  categoryMap: Map<string, Category>;
  getIsoDateString: (date: Date) => string;
  parseTimeToHours: (timeStr?: string | null) => number | null;
  format12h: (hourFloatOrStr?: number | string | null) => string;
  onItemClick: (ev: RenderEvent, e: React.MouseEvent) => void;
}

export function CalendarWeekView({
  weekDays,
  timelineHours,
  dynamicHourRange,
  HOUR_HEIGHT,
  sourceFilter,
  getRenderEventsForDate,
  categoryMap,
  getIsoDateString,
  parseTimeToHours,
  format12h,
  onItemClick,
}: CalendarWeekViewProps) {
  return (
    <div className="flex flex-col h-full min-w-[750px]">
      <div className="grid grid-cols-[70px_repeat(7,1fr)] border-b border-border bg-muted/30 text-center text-xs font-semibold py-2.5">
        <span className="text-muted-foreground flex items-center justify-center font-mono text-[11px]">
          <Clock className="size-3.5 mr-1" /> 12H
        </span>
        {weekDays.map((w, idx) => {
          const isToday = w.iso === getIsoDateString(new Date());
          return (
            <div key={idx} className="flex flex-col items-center justify-center">
              <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                {w.date.toLocaleDateString("en-US", { weekday: "short" })}
              </span>
              {sourceFilter !== "schedule" && (
                <span
                  className={`text-sm font-bold mt-0.5 size-6 flex items-center justify-center rounded-full ${
                    isToday ? "bg-primary text-white" : "text-foreground"
                  }`}
                >
                  {w.date.getDate()}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto max-h-[600px]">
        <div className="grid grid-cols-[70px_repeat(7,1fr)] relative divide-x divide-border">
          {/* Dynamic Time Axis */}
          <div className="divide-y divide-border bg-muted/10">
            {timelineHours.map((hourStr) => (
              <div
                key={hourStr}
                className="px-2 text-[11px] font-mono text-muted-foreground flex items-start justify-end pt-1"
                style={{ height: `${HOUR_HEIGHT}px` }}
              >
                {hourStr}
              </div>
            ))}
          </div>

          {/* 7 Day Columns */}
          {weekDays.map((wDay, dIdx) => {
            const dayEvents = getRenderEventsForDate(wDay.date);

            return (
              <div
                key={dIdx}
                className="relative divide-y divide-border bg-card/40"
                style={{ height: `${timelineHours.length * HOUR_HEIGHT}px` }}
              >
                {timelineHours.map((hourStr) => (
                  <div
                    key={hourStr}
                    className="border-b border-border/40 hover:bg-muted/10 transition-colors"
                    style={{ height: `${HOUR_HEIGHT}px` }}
                  />
                ))}

                {/* Rendered Events Resized & Positioned by Time */}
                {dayEvents.map((ev) => {
                  const cat = ev.categoryId ? categoryMap.get(ev.categoryId) : null;

                  const startH = parseTimeToHours(ev.startTime) ?? dynamicHourRange.minHour;
                  const endH = parseTimeToHours(ev.endTime) ?? (startH + 1);

                  const durationHours = Math.max(0.5, endH - startH);
                  const topPx = (startH - dynamicHourRange.minHour) * HOUR_HEIGHT;
                  const heightPx = Math.max(36, durationHours * HOUR_HEIGHT - 4);

                  const isSchedule = ev.type === "schedule_item";

                  return (
                    <div
                      key={ev.id}
                      onClick={(e) => onItemClick(ev, e)}
                      className="absolute inset-x-1 p-2 rounded-lg text-xs font-semibold shadow-xs border transition-all hover:scale-[1.02] hover:z-20 z-10 flex flex-col justify-between overflow-hidden cursor-pointer"
                      style={{
                        top: `${topPx + 2}px`,
                        height: `${heightPx}px`,
                        backgroundColor: cat?.color ? `${cat.color}25` : "#3b82f625",
                        color: cat?.color || "#3b82f6",
                        borderColor: cat?.color || "#3b82f6",
                      }}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1">
                          <span className="truncate font-bold flex items-center gap-1">
                            {isSchedule && <Repeat className="size-3 shrink-0 opacity-70" />}
                            {ev.title}
                          </span>
                        </div>
                        {ev.scheduleTitle && isSchedule ? (
                          <p className="text-[10px] opacity-75 truncate font-medium mt-0.5">
                            {ev.scheduleTitle}
                          </p>
                        ) : ev.description ? (
                          <p className="text-[11px] opacity-80 truncate font-normal mt-0.5">
                            {ev.description}
                          </p>
                        ) : null}
                      </div>

                      {/* 12-Hour Start to End Time Badge */}
                      <div className="text-[10px] opacity-90 font-mono font-medium flex items-center gap-1 mt-1">
                        <Clock className="size-3 shrink-0" />
                        <span>
                          {format12h(ev.startTime || startH)} - {format12h(ev.endTime || endH)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
