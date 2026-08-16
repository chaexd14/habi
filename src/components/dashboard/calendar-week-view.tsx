"use client";

import * as React from "react";
import { Category } from "@/types/category";
import { RenderEvent } from "@/components/forms/edit-event-modal";
import { Clock, Repeat } from "lucide-react";
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
    <div className="flex h-full min-w-[750px] flex-col overflow-hidden bg-background select-none">
      {/* Calendar Header */}
      <div className="sticky top-0 z-30 grid grid-cols-[68px_repeat(7,1fr)] border-b border-border/70 bg-background/90 py-2.5 text-center text-xs font-semibold backdrop-blur-md">
        {/* Time Header */}
        <span className="flex items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/75">
          <Clock className="size-3" />
          12H
        </span>

        {weekDays.map((w, idx) => {
          const isToday = w.iso === getIsoDateString(new Date());

          return (
            <div
              key={idx}
              className={`relative flex flex-col items-center justify-center gap-0.5 ${
                isToday ? "text-primary" : ""
              }`}
            >
              {/* Today indicator bar */}
              {isToday && (
                <span className="absolute -top-2.5 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-primary" />
              )}

              <span
                className={`text-[10px] font-bold uppercase tracking-[0.14em] ${
                  isToday ? "text-primary font-extrabold" : "text-muted-foreground/80"
                }`}
              >
                {w.date.toLocaleDateString("en-US", {
                  weekday: "short",
                })}
              </span>

              {sourceFilter !== "schedule" && (
                <span
                  className={`mt-0.5 flex size-6.5 items-center justify-center rounded-full text-xs font-bold transition-all ${
                    isToday
                      ? "bg-primary text-primary-foreground font-extrabold shadow-xs shadow-primary/30 ring-2 ring-primary/20"
                      : "text-foreground hover:bg-muted/40"
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
      <div className="min-h-0 flex-1 overflow-y-auto max-h-[600px]">
        <div className="grid grid-cols-[68px_repeat(7,1fr)] relative divide-x divide-border/60">
          {/* Time Axis */}
          <div className="divide-y divide-border/50 bg-muted/[0.12]">
            {timelineHours.map((hourStr) => (
              <div
                key={hourStr}
                className="flex items-start justify-end px-2 pt-1 font-mono text-[10px] font-medium tracking-tight text-muted-foreground/75"
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
                className="relative divide-y divide-border/40 bg-background/30"
                style={{
                  height: `${timelineHours.length * HOUR_HEIGHT}px`,
                }}
              >
                {/* Hour Grid */}
                {timelineHours.map((hourStr) => (
                  <div
                    key={hourStr}
                    className="group border-b border-border/35 transition-colors hover:bg-muted/[0.12]"
                    style={{
                      height: `${HOUR_HEIGHT}px`,
                    }}
                  />
                ))}

                {/* Events */}
                {positionedEvents.map(({ event: ev, leftPercent, widthPercent }) => {
                  const cat = ev.categoryId ? categoryMap.get(ev.categoryId) : null;

                  const startH =
                    parseTimeToHours(ev.startTime) ?? dynamicHourRange.minHour;
                  const endH =
                    parseEndTimeToHours(ev.endTime, ev.startTime, parseTimeToHours) ?? (startH + 1);

                  const durationHours = Math.max(0.5, endH - startH);
                  const topPx = (startH - dynamicHourRange.minHour) * HOUR_HEIGHT;
                  const heightPx = Math.max(36, durationHours * HOUR_HEIGHT - 4);
                  const isSchedule = ev.type === "schedule_item";

                  return (
                    <div
                      key={ev.id}
                      onClick={(e) => onItemClick(ev, e)}
                      className="
                        group absolute z-10
                        flex cursor-pointer flex-col justify-between
                        overflow-hidden rounded-lg
                        border p-1.5 pl-2.5
                        text-xs font-medium
                        shadow-2xs
                        transition-all duration-150
                        hover:z-20
                        hover:-translate-y-px
                        hover:shadow-xs
                        focus-visible:outline-none
                        focus-visible:ring-2
                        focus-visible:ring-primary/40
                      "
                      style={{
                        top: `${topPx + 2}px`,
                        height: `${heightPx}px`,
                        left: `calc(${leftPercent}% + 2px)`,
                        width: `calc(${widthPercent}% - 4px)`,
                        backgroundColor: cat?.color
                          ? `${cat.color}18`
                          : "#3b82f618",
                        color: cat?.color || "#3b82f6",
                        borderColor: cat?.color
                          ? `${cat.color}45`
                          : "#3b82f645",
                      }}
                    >
                      {/* Accent Bar */}
                      <span
                        className="absolute inset-y-0 left-0 w-1 rounded-l-lg"
                        style={{
                          backgroundColor: cat?.color || "#3b82f6",
                        }}
                      />

                      <div className="min-w-0">
                        {/* Event Title */}
                        <div className="flex min-w-0 items-center gap-1.5">
                          {isSchedule && (
                            <Repeat className="size-3 shrink-0 opacity-75" />
                          )}

                          <span
                            className="truncate font-semibold tracking-tight text-xs leading-tight"
                            style={{ color: cat?.color || "inherit" }}
                          >
                            {ev.title}
                          </span>
                        </div>

                        {/* Schedule Parent Title / Description */}
                        {ev.scheduleTitle && isSchedule ? (
                          <div className="mt-0.5 flex items-center">
                            <span className="truncate text-[9px] font-semibold tracking-tight px-1.5 py-0.2 rounded-md bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                              {ev.scheduleTitle}
                            </span>
                          </div>
                        ) : ev.description ? (
                          <p className="mt-0.5 truncate text-[10px] font-normal leading-tight opacity-75">
                            {ev.description}
                          </p>
                        ) : null}

                        {cat && (
                          <span
                            className="inline-flex items-center gap-1 text-[9px] font-semibold mt-1 px-1.5 py-0.2 rounded-full border border-white/10 shrink-0"
                            style={{ backgroundColor: `${cat.color}15`, color: cat.color }}
                          >
                            <span className="size-1.5 rounded-full" style={{ backgroundColor: cat.color }} />
                            {cat.name}
                          </span>
                        )}
                      </div>

                      {/* Time */}
                      <div className="mt-1 flex items-center gap-1">
                        <div
                          className="flex min-w-0 items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-medium font-mono"
                          style={{
                            backgroundColor: cat?.color
                              ? `${cat.color}15`
                              : "#3b82f615",
                          }}
                        >
                          <Clock className="size-2.5 shrink-0 opacity-70" />
                          <span className="truncate">
                            {format12h(ev.startTime || startH)} – {format12h(ev.endTime || endH)}
                          </span>
                        </div>
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
