"use client";

import * as React from "react";
import { Category } from "@/types/category";
import { RenderEvent } from "@/components/forms/edit-event-modal";
import { Repeat } from "lucide-react";

export interface CalendarMonthViewProps {
  monthDays: Array<{ date: Date; isCurrentMonth: boolean; iso: string }>;
  getRenderEventsForDate: (date: Date) => RenderEvent[];
  categoryMap: Map<string, Category>;
  getIsoDateString: (date: Date) => string;
  onSelectDate: (date: Date) => void;
  onItemClick: (ev: RenderEvent, e: React.MouseEvent) => void;
}

export function CalendarMonthView({
  monthDays,
  getRenderEventsForDate,
  categoryMap,
  getIsoDateString,
  onSelectDate,
  onItemClick,
}: CalendarMonthViewProps) {
  return (
    <div
      role="grid"
      aria-label="Month Calendar Grid"
      className="flex flex-col h-full min-w-[650px] bg-background select-none"
    >
      {/* Weekday Column Headers */}
      <div
        role="row"
        className="grid grid-cols-7 border-b border-border bg-muted/30 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground py-2"
      >
        <span role="columnheader">Sun</span>
        <span role="columnheader">Mon</span>
        <span role="columnheader">Tue</span>
        <span role="columnheader">Wed</span>
        <span role="columnheader">Thu</span>
        <span role="columnheader">Fri</span>
        <span role="columnheader">Sat</span>
      </div>

      {/* 6-row Month Grid */}
      <div
        role="rowgroup"
        className="grid grid-cols-7 grid-rows-6 flex-1 divide-x divide-y divide-border border-b border-border"
      >
        {monthDays.map((dayObj, idx) => {
          const dayEvents = getRenderEventsForDate(dayObj.date);
          const isToday = dayObj.iso === getIsoDateString(new Date());
          const dateFormatted = dayObj.date.toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          });

          return (
            <div
              key={idx}
              role="gridcell"
              tabIndex={0}
              aria-label={`${dateFormatted}, ${dayEvents.length} events`}
              onClick={() => onSelectDate(dayObj.date)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectDate(dayObj.date);
                }
              }}
              className={`min-h-[100px] p-2 flex flex-col justify-between transition-colors duration-100 cursor-pointer hover:bg-muted/30 focus-visible:bg-muted/40 focus-visible:outline-none group ${
                !dayObj.isCurrentMonth
                  ? "bg-muted/10 text-muted-foreground/30"
                  : "bg-card"
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs size-6 flex items-center justify-center rounded-full transition-transform ${
                    isToday
                      ? "bg-foreground text-background font-semibold"
                      : dayObj.isCurrentMonth
                      ? "text-foreground font-medium"
                      : "text-muted-foreground/40 font-normal"
                  }`}
                >
                  {dayObj.date.getDate()}
                </span>
                {dayEvents.length > 0 && (
                  <span className="text-[10px] text-muted-foreground font-normal">
                    {dayEvents.length}
                  </span>
                )}
              </div>

              {/* Day Events Stack */}
              <div className="mt-1 space-y-1 overflow-y-auto max-h-[72px] scrollbar-none">
                {dayEvents.map((ev) => {
                  const cat = ev.categoryId ? categoryMap.get(ev.categoryId) : null;
                  const isSchedule = ev.type === "schedule_item";

                  return (
                    <div
                      key={ev.id}
                      role="button"
                      tabIndex={0}
                      aria-label={`${ev.title} ${isSchedule ? `recurring schedule: ${ev.scheduleTitle || ""}` : "calendar event"}`}
                      onClick={(e) => onItemClick(ev, e)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onItemClick(ev, e as unknown as React.MouseEvent);
                        }
                      }}
                      className="px-1.5 py-0.5 rounded text-[11px] font-medium flex flex-col gap-0.5 border border-border/80 bg-card hover:bg-muted/60 cursor-pointer transition-colors focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
                    >
                      <div className="flex items-center justify-between gap-1 min-w-0">
                        <div className="flex items-center gap-1.5 min-w-0 truncate">
                          <span
                            className="size-1.5 rounded-full shrink-0"
                            style={{ backgroundColor: cat?.color || "#71717a" }}
                          />
                          <span className="truncate text-foreground font-medium">{ev.title}</span>
                        </div>

                        {isSchedule && (
                          <Repeat className="size-2.5 shrink-0 opacity-50 text-muted-foreground" aria-hidden="true" />
                        )}
                      </div>

                      {isSchedule && ev.scheduleTitle && (
                        <span className="text-[9px] truncate text-muted-foreground leading-none pl-3">
                          {ev.scheduleTitle}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default CalendarMonthView;
