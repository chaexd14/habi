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
    <div className="flex flex-col h-full min-w-[650px]">
      <div className="grid grid-cols-7 border-b border-border bg-muted/30 text-center text-xs font-semibold text-muted-foreground py-2.5">
        <span>SUN</span>
        <span>MON</span>
        <span>TUE</span>
        <span>WED</span>
        <span>THU</span>
        <span>FRI</span>
        <span>SAT</span>
      </div>

      <div className="grid grid-cols-7 grid-rows-6 flex-1 border-b border-border">
        {monthDays.map((dayObj, idx) => {
          const dayEvents = getRenderEventsForDate(dayObj.date);
          const isToday = dayObj.iso === getIsoDateString(new Date());

          return (
            <div
              key={idx}
              onClick={() => onSelectDate(dayObj.date)}
              className={`min-h-[95px] p-2 border-r border-b border-border flex flex-col justify-between transition-colors cursor-pointer hover:bg-accent/40 ${
                !dayObj.isCurrentMonth ? "bg-muted/10 text-muted-foreground/40" : "bg-card"
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-bold size-6 flex items-center justify-center rounded-full ${
                    isToday ? "bg-primary text-white" : "text-foreground"
                  }`}
                >
                  {dayObj.date.getDate()}
                </span>
              </div>

              <div className="mt-1 space-y-1 overflow-y-auto max-h-[65px] scrollbar-none">
                {dayEvents.map((ev) => {
                  const cat = ev.categoryId ? categoryMap.get(ev.categoryId) : null;
                  const isSchedule = ev.type === "schedule_item";

                  return (
                    <div
                      key={ev.id}
                      onClick={(e) => onItemClick(ev, e)}
                      className="px-1.5 py-0.5 rounded text-[11px] font-medium flex flex-col gap-0.5 border border-white/10 cursor-pointer hover:opacity-80 transition-opacity"
                      style={{
                        backgroundColor: cat?.color ? `${cat.color}25` : "#3b82f625",
                        color: cat?.color || "#3b82f6",
                        borderColor: cat?.color ? `${cat.color}50` : "#3b82f650",
                      }}
                    >
                      <div className="flex items-center justify-between gap-1 min-w-0">
                        <div className="flex items-center gap-1 min-w-0 truncate">
                          <span
                            className="size-1.5 rounded-full shrink-0"
                            style={{ backgroundColor: cat?.color || "#3b82f6" }}
                          />
                          <span className="truncate font-semibold">{ev.title}</span>
                        </div>

                        {isSchedule ? (
                          <Repeat className="size-2.5 shrink-0 opacity-70" />
                        ) : null}
                      </div>

                      {isSchedule && ev.scheduleTitle && (
                        <span className="text-[9px] font-normal truncate opacity-75 leading-none">
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
