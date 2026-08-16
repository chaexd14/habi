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
    <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 sm:p-4 border-b border-border/70 bg-card/60 backdrop-blur-md">
      {/* Navigation & Date Display */}
      <div className="flex items-center gap-3">
        {sourceFilter !== "schedule" && (
          <div className="flex items-center gap-0.5 bg-background/90 rounded-lg border border-border/70 p-0.5 shadow-2xs">
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={onPrev}
              title="Previous"
              className="size-7 rounded-md text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="xs"
              onClick={onToday}
              className="h-7 px-2.5 text-xs font-semibold rounded-md text-foreground hover:bg-muted"
            >
              Today
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={onNext}
              title="Next"
              className="size-7 rounded-md text-muted-foreground hover:text-foreground"
            >
              <ChevronRight className="size-3.5" />
            </Button>
          </div>
        )}

        <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
          {sourceFilter === "schedule" ? (
            <>
              <Repeat className="size-4.5 text-blue-500 shrink-0" />
              <span className="truncate">
                {schedules.find((s) => s.id === selectedScheduleFilter)?.title || "Weekly Schedule"}
              </span>
            </>
          ) : (
            <>
              <CalendarIcon className="size-4.5 text-primary shrink-0" />
              <span>{formatDisplayDate(currentDate, viewMode)}</span>
            </>
          )}
        </h2>
      </div>

      {/* Source Filter (All / Calendar / Schedule) & View Switcher */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Filter Segmented Control */}
        <div className="flex items-center rounded-lg border border-border/70 bg-muted/40 p-0.5 text-xs font-medium shadow-2xs">
          <button
            type="button"
            onClick={() => onFilterChange("all")}
            className={`px-2.5 py-1.5 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
              sourceFilter === "all"
                ? "bg-background text-foreground font-semibold shadow-2xs"
                : "text-muted-foreground hover:text-foreground hover:bg-background/30"
            }`}
          >
            <Filter className="size-3 opacity-70" />
            <span>All</span>
          </button>
          <button
            type="button"
            onClick={() => onFilterChange("calendar")}
            className={`px-2.5 py-1.5 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
              sourceFilter === "calendar"
                ? "bg-background text-primary font-semibold shadow-2xs"
                : "text-muted-foreground hover:text-foreground hover:bg-background/30"
            }`}
          >
            <CalendarDays className="size-3 opacity-70" />
            <span>Calendar</span>
          </button>
          <button
            type="button"
            onClick={() => onFilterChange("schedule")}
            className={`px-2.5 py-1.5 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
              sourceFilter === "schedule"
                ? "bg-background text-blue-500 font-semibold shadow-2xs"
                : "text-muted-foreground hover:text-foreground hover:bg-background/30"
            }`}
          >
            <Repeat className="size-3 opacity-70" />
            <span>Schedule</span>
          </button>
        </div>

        {/* Specific Schedule Filter Dropdown */}
        {schedules.length > 0 && (sourceFilter === "schedule" || sourceFilter === "all") && (
          <div className="flex items-center text-xs">
            <select
              value={selectedScheduleFilter}
              onChange={(e) => onScheduleFilterChange(e.target.value)}
              className="h-8.5 rounded-lg border border-border/70 bg-background px-2.5 text-xs font-medium shadow-2xs outline-none focus-visible:border-ring dark:bg-input/20 cursor-pointer"
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
        <div className="flex items-center rounded-lg border border-border/70 bg-muted/40 p-0.5 text-xs font-medium shadow-2xs">
          {sourceFilter !== "schedule" && (
            <button
              type="button"
              onClick={() => onViewModeChange("month")}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                viewMode === "month"
                  ? "bg-primary text-primary-foreground font-semibold shadow-2xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/30"
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
                className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                  viewMode === "week"
                    ? "bg-primary text-primary-foreground font-semibold shadow-2xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/30"
                }`}
              >
                Week
              </button>
              {sourceFilter !== "schedule" && (
                <button
                  type="button"
                  onClick={() => onViewModeChange("day")}
                  className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                    viewMode === "day"
                      ? "bg-primary text-primary-foreground font-semibold shadow-2xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/30"
                  }`}
                >
                  Day
                </button>
              )}
            </>
          )}
        </div>

        {/* Action Button */}
        <Button size="sm" onClick={onOpenAddModal} className="h-8.5 gap-1.5 font-semibold shadow-xs">
          <Plus className="size-3.5" />
          <span>Add Item</span>
        </Button>
      </div>
    </div>
  );
}
