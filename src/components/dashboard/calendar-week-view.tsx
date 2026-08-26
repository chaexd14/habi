"use client";

import * as React from "react";
import { Category } from "@/types/category";
import { RenderEvent } from "@/components/forms/edit-event-modal";
import { Repeat } from "lucide-react";
import { SourceFilter } from "./calendar-toolbar";
import { computeOverlappingLayout, parseEndTimeToHours } from "@/lib/utils/calendar-layout";

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
    <div
      role="region"
      aria-label="Weekly Calendar Timeline"
      className="flex h-full min-w-[750px] flex-col overflow-hidden bg-background select-none"
    >
      {/* Calendar Header */}
      <div className="sticky top-0 z-30 grid grid-cols-[60px_repeat(7,1fr)] border-b border-border bg-background/95 py-2 text-center text-xs backdrop-blur-xs">
        {/* Time Header */}
        <span className="flex items-center justify-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Time
        </span>

        {weekDays.map((w, idx) => {
          const isToday = w.iso === getIsoDateString(new Date());

          return (
            <div
              key={idx}
              className="relative flex flex-col items-center justify-center gap-0.5"
            >
              <span
                className={`text-[10px] font-semibold uppercase tracking-wider ${
                  isToday ? "text-foreground font-bold" : "text-muted-foreground"
                }`}
              >
                {w.date.toLocaleDateString("en-US", {
                  weekday: "short",
                })}
              </span>

              {sourceFilter !== "schedule" && (
                <span
                  className={`flex size-6 items-center justify-center rounded-full text-xs transition-colors ${
                    isToday
                      ? "bg-foreground text-background font-semibold"
                      : "text-foreground font-medium hover:bg-muted/60"
                  }`}
                >
                  {w.date.getDate()}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Calendar Body */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="grid grid-cols-[60px_repeat(7,1fr)] relative divide-x divide-border">
          {/* Time Axis */}
          <div className="divide-y divide-border/60 bg-muted/10">
            {timelineHours.map((hourStr) => (
              <div
                key={hourStr}
                className="flex items-start justify-end px-2 pt-1 font-mono text-[10px] text-muted-foreground"
                style={{ height: `${HOUR_HEIGHT}px` }}
              >
                {hourStr}
              </div>
            ))}
          </div>

          {/* 7 Day Columns */}
          {weekDays.map((wDay, dIdx) => {
            const dayEvents = getRenderEventsForDate(wDay.date);
            const positionedEvents = computeOverlappingLayout(
              dayEvents,
              parseTimeToHours,
              dynamicHourRange.minHour
            );

            return (
              <div
                key={dIdx}
                className="relative divide-y divide-border/40 bg-card/20"
                style={{
                  height: `${timelineHours.length * HOUR_HEIGHT}px`,
                }}
              >
                {/* Hour Grid Lines */}
                {timelineHours.map((hourStr) => (
                  <div
                    key={hourStr}
                    className="border-b border-border/40 transition-colors hover:bg-muted/20"
                    style={{
                      height: `${HOUR_HEIGHT}px`,
                    }}
                  />
                ))}

                {/* Rendered Event Cards */}
                {positionedEvents.map(({ event: ev, leftPercent, widthPercent }) => {
                  const cat = ev.categoryId ? categoryMap.get(ev.categoryId) : null;

                  const startH =
                    parseTimeToHours(ev.startTime) ?? dynamicHourRange.minHour;
                  const endH =
                    parseEndTimeToHours(ev.endTime, ev.startTime, parseTimeToHours) ?? (startH + 1);

                  const durationHours = Math.max(0.5, endH - startH);
                  const topPx = (startH - dynamicHourRange.minHour) * HOUR_HEIGHT;
                  const minCardHeight = Math.max(18, Math.round(28 * (HOUR_HEIGHT / 64)));
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
                      className={`
                        group absolute z-10
                        flex cursor-pointer flex-col justify-between
                        overflow-hidden rounded-md
                        border border-border bg-card
                        text-xs
                        shadow-2xs
                        transition-colors duration-100
                        hover:z-20 hover:bg-muted/70
                        focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring
                        ${heightPx < 30 ? "p-1 pl-2" : "p-1.5 pl-2.5"}
                      `}
                      style={{
                        top: `${topPx + 2}px`,
                        height: `${heightPx}px`,
                        left: `calc(${leftPercent}% + 2px)`,
                        width: `calc(${widthPercent}% - 4px)`,
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
                        {/* Event Title */}
                        <div className="flex min-w-0 items-center gap-1">
                          {isSchedule && (
                            <Repeat className="size-2.5 shrink-0 opacity-60 text-muted-foreground" aria-hidden="true" />
                          )}

                          <span className="truncate font-medium text-foreground text-xs leading-tight">
                            {ev.title}
                          </span>
                        </div>

                        {/* Schedule Parent Title */}
                        {ev.scheduleTitle && isSchedule && heightPx >= 36 ? (
                          <div className="mt-0.5 flex items-center">
                            <span className="truncate text-[9px] text-muted-foreground leading-none">
                              {ev.scheduleTitle}
                            </span>
                          </div>
                        ) : null}
                      </div>

                      {/* Time Label */}
                      {heightPx >= 28 && (
                        <div className="mt-0.5 flex items-center gap-1">
                          <span className="truncate font-mono text-[9px] text-muted-foreground">
                            {timeLabel}
                          </span>
                        </div>
                      )}
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

export default CalendarWeekView;
