"use client";

import * as React from "react";
import { Schedule } from "@/types/schedule";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Plus,
  Repeat,
  CalendarDays,
  Filter,
} from "lucide-react";

export type ViewMode = "month" | "week" | "day";
export type SourceFilter = "all" | "calendar" | "schedule";

export interface CalendarToolbarProps {
  currentDate: Date;
  viewMode: ViewMode;
  sourceFilter: SourceFilter;
  schedules: Schedule[];
  selectedScheduleFilter: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onFilterChange: (filter: SourceFilter) => void;
  onScheduleFilterChange: (scheduleId: string) => void;
  onViewModeChange: (mode: ViewMode) => void;
  onOpenAddModal: () => void;
  formatDisplayDate: (date: Date, mode: ViewMode) => string;
}

export function CalendarToolbar({
  currentDate,
  viewMode,
  sourceFilter,
  schedules,
  selectedScheduleFilter,
  onPrev,
  onNext,
  onToday,
  onFilterChange,
  onScheduleFilterChange,
  onViewModeChange,
  onOpenAddModal,
  formatDisplayDate,
}: CalendarToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 p-4 border-b border-border bg-card/50 backdrop-blur-xs">
      {/* Navigation & Title */}
      <div className="flex items-center gap-3">
        {sourceFilter !== "schedule" && (
          <div className="flex items-center gap-1 bg-background rounded-lg border border-border p-0.5">
            <Button variant="ghost" size="icon-sm" onClick={onPrev} title="Previous">
              <ChevronLeft className="size-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onToday} className="px-2.5 text-xs font-semibold">
              Today
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={onNext} title="Next">
              <ChevronRight className="size-4" />
            </Button>
          </div>
        )}

        <h2 className="text-lg md:text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
          {sourceFilter === "schedule" ? (
            <>
              <Repeat className="size-5 text-blue-500" />
              Weekly Schedule
            </>
          ) : (
            <>
              <CalendarIcon className="size-5 text-primary" />
              {formatDisplayDate(currentDate, viewMode)}
            </>
          )}
        </h2>
      </div>

      {/* Source Filter (All / Calendar / Schedule) & View Switcher */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center rounded-lg border border-border bg-muted/40 p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => onFilterChange("all")}
            className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
              sourceFilter === "all"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Filter className="size-3" />
            All
          </button>
          <button
            type="button"
            onClick={() => onFilterChange("calendar")}
            className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
              sourceFilter === "calendar"
                ? "bg-background text-primary shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <CalendarDays className="size-3" />
            Calendar Items
          </button>
          <button
            type="button"
            onClick={() => onFilterChange("schedule")}
            className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
              sourceFilter === "schedule"
                ? "bg-background text-blue-500 shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Repeat className="size-3" />
            Schedules
          </button>
        </div>

        {/* Specific Schedule Filter Dropdown */}
        {schedules.length > 0 && (sourceFilter === "schedule" || sourceFilter === "all") && (
          <div className="flex items-center gap-1.5 text-xs">
            <select
              value={selectedScheduleFilter}
              onChange={(e) => onScheduleFilterChange(e.target.value)}
              className="h-8.5 rounded-lg border border-border bg-background px-2.5 text-xs font-semibold shadow-2xs outline-none focus-visible:border-ring dark:bg-input/30"
            >
              <option value="ALL">All Schedules</option>
              {schedules.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* View Mode Switcher Tabs */}
        <div className="flex items-center rounded-lg border border-border bg-background p-1 text-xs font-semibold">
          {sourceFilter !== "schedule" && (
            <button
              type="button"
              onClick={() => onViewModeChange("month")}
              className={`px-3 py-1.5 rounded-md transition-all ${
                viewMode === "month"
                  ? "bg-primary text-white shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Month
            </button>
          )}

          {sourceFilter !== "calendar" && (
            <>
              <button
                type="button"
                onClick={() => onViewModeChange("week")}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  viewMode === "week"
                    ? "bg-primary text-white shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Week
              </button>
              {sourceFilter !== "schedule" && (
                <button
                  type="button"
                  onClick={() => onViewModeChange("day")}
                  className={`px-3 py-1.5 rounded-md transition-all ${
                    viewMode === "day"
                      ? "bg-primary text-white shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Day
                </button>
              )}
            </>
          )}
        </div>

        <Button size="sm" onClick={onOpenAddModal} className="gap-1.5 font-semibold">
          <Plus className="size-4" />
          Add Item
        </Button>
      </div>
    </div>
  );
}
