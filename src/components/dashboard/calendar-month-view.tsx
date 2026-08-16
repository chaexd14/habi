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
    <div className="flex flex-col h-full min-w-[650px] bg-background select-none">
      {/* Weekday Column Headers */}
      <div className="grid grid-cols-7 border-b border-border/70 bg-muted/25 text-center text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground/80 py-2.5">
        <span>Sun</span>
        <span>Mon</span>
        <span>Tue</span>
        <span>Wed</span>
        <span>Thu</span>
        <span>Fri</span>
        <span>Sat</span>
      </div>

      {/* 6-row Month Grid */}
      <div className="grid grid-cols-7 grid-rows-6 flex-1 divide-x divide-y divide-border/60 border-b border-border/60">
        {monthDays.map((dayObj, idx) => {
          const dayEvents = getRenderEventsForDate(dayObj.date);
          const isToday = dayObj.iso === getIsoDateString(new Date());

          return (
            <div
              key={idx}
              onClick={() => onSelectDate(dayObj.date)}
              className={`min-h-[100px] p-2 flex flex-col justify-between transition-all duration-150 cursor-pointer hover:bg-muted/30 group ${
                !dayObj.isCurrentMonth ? "bg-muted/[0.08] text-muted-foreground/35" : "bg-card/40"
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-bold size-6.5 flex items-center justify-center rounded-full transition-transform group-hover:scale-105 ${
                    isToday
                      ? "bg-primary text-primary-foreground font-extrabold shadow-xs shadow-primary/30 ring-2 ring-primary/20"
                      : dayObj.isCurrentMonth
                      ? "text-foreground"
                      : "text-muted-foreground/40 font-normal"
                  }`}
                >
                  {dayObj.date.getDate()}
                </span>
                {dayEvents.length > 0 && (
                  <span className="text-[10px] font-medium text-muted-foreground/60 pr-1">
                    {dayEvents.length} {dayEvents.length === 1 ? "item" : "items"}
                  </span>
                )}
              </div>

              {/* Day Events Stack */}
              <div className="mt-1 space-y-1 overflow-y-auto max-h-[70px] scrollbar-none">
                {dayEvents.map((ev) => {
                  const cat = ev.categoryId ? categoryMap.get(ev.categoryId) : null;
                  const isSchedule = ev.type === "schedule_item";

                  return (
                    <div
                      key={ev.id}
                      onClick={(e) => onItemClick(ev, e)}
                      className="px-2 py-1 rounded-md text-[11px] font-medium flex flex-col gap-0.5 border cursor-pointer transition-all duration-150 hover:-translate-y-px hover:shadow-2xs"
                      style={{
                        backgroundColor: cat?.color ? `${cat.color}15` : "#3b82f615",
                        color: cat?.color || "#3b82f6",
                        borderColor: cat?.color ? `${cat.color}35` : "#3b82f635",
                      }}
                    >
                      <div className="flex items-center justify-between gap-1.5 min-w-0">
                        <div className="flex items-center gap-1.5 min-w-0 truncate">
                          <span
                            className="size-1.5 rounded-full shrink-0"
                            style={{ backgroundColor: cat?.color || "#3b82f6" }}
                          />
                          <span className="truncate font-semibold tracking-tight">{ev.title}</span>
                        </div>

                        {isSchedule ? (
                          <Repeat className="size-2.5 shrink-0 opacity-70" />
                        ) : null}
                      </div>

                      {isSchedule && ev.scheduleTitle && (
                        <span className="text-[9px] font-medium truncate opacity-75 leading-none pl-3">
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
