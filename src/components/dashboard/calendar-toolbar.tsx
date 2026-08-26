"use client";

import * as React from "react";
import { Schedule } from "@/types/schedule";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Plus,
  Repeat,
  CalendarDays,
  Filter,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

export type ViewMode = "month" | "week" | "day";
export type SourceFilter = "all" | "calendar" | "schedule";
export type ZoomLevel = 50 | 75 | 100 | 125 | 150;
export const ZOOM_LEVELS: ZoomLevel[] = [50, 75, 100, 125, 150];

export interface CalendarToolbarProps {
  currentDate: Date;
  viewMode: ViewMode;
  sourceFilter: SourceFilter;
  schedules: Schedule[];
  selectedScheduleFilter: string;
  zoomLevel?: ZoomLevel;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onFilterChange: (filter: SourceFilter) => void;
  onScheduleFilterChange: (scheduleId: string) => void;
  onViewModeChange: (mode: ViewMode) => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onOpenAddModal: () => void;
  formatDisplayDate: (date: Date, mode: ViewMode) => string;
}

export function CalendarToolbar({
  currentDate,
  viewMode,
  sourceFilter,
  schedules,
  selectedScheduleFilter,
  zoomLevel = 100,
  onPrev,
  onNext,
  onToday,
  onFilterChange,
  onScheduleFilterChange,
  onViewModeChange,
  onZoomIn,
  onZoomOut,
  onOpenAddModal,
  formatDisplayDate,
}: CalendarToolbarProps) {
  const scheduleFilterItems = React.useMemo(() => [
    { label: "All Schedules", value: "ALL" },
    ...schedules.map((s) => ({ label: s.title, value: s.id })),
  ], [schedules]);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3 sm:px-4 border-b border-border bg-card">
      {/* Navigation & Date Display */}
      <div className="flex items-center gap-2.5">
        {sourceFilter !== "schedule" && (
          <div
            role="group"
            aria-label="Date navigation controls"
            className="flex items-center gap-0.5 bg-muted/50 rounded-md border border-border p-0.5"
          >
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={onPrev}
              aria-label="Previous date period"
              title="Previous"
              className="size-6.5 rounded text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <ChevronLeft className="size-3" />
            </Button>
            <Button
              variant="ghost"
              size="xs"
              onClick={onToday}
              aria-label="Jump to current date (Today)"
              className="h-6.5 px-2 text-[11px] font-medium rounded text-foreground hover:bg-background transition-colors cursor-pointer"
            >
              Today
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={onNext}
              aria-label="Next date period"
              title="Next"
              className="size-6.5 rounded text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <ChevronRight className="size-3" />
            </Button>
          </div>
        )}

        <h2 className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-1.5">
          {sourceFilter === "schedule" ? (
            <>
              <Repeat className="size-3.5 opacity-70 shrink-0" aria-hidden="true" />
              <span className="truncate">
                {schedules.find((s) => s.id === selectedScheduleFilter)?.title || "Weekly Schedule"}
              </span>
            </>
          ) : (
            <>
              <CalendarIcon className="size-3.5 opacity-70 shrink-0" aria-hidden="true" />
              <span>{formatDisplayDate(currentDate, viewMode)}</span>
            </>
          )}
        </h2>
      </div>

      {/* Controls & Filter Groups */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Source Filter Segmented Control */}
        <div
          role="radiogroup"
          aria-label="Filter events by source"
          className="flex items-center rounded-md border border-border bg-muted/50 p-0.5 text-xs font-medium"
        >
          <button
            type="button"
            role="radio"
            aria-checked={sourceFilter === "all"}
            onClick={() => onFilterChange("all")}
            className={`px-2 py-1 rounded text-[11px] transition-colors flex items-center gap-1 cursor-pointer ${
              sourceFilter === "all"
                ? "bg-background text-foreground font-medium shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Filter className="size-2.5 opacity-60" aria-hidden="true" />
            <span>All</span>
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={sourceFilter === "calendar"}
            onClick={() => onFilterChange("calendar")}
            className={`px-2 py-1 rounded text-[11px] transition-colors flex items-center gap-1 cursor-pointer ${
              sourceFilter === "calendar"
                ? "bg-background text-foreground font-medium shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <CalendarDays className="size-2.5 opacity-60" aria-hidden="true" />
            <span>Calendar</span>
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={sourceFilter === "schedule"}
            onClick={() => onFilterChange("schedule")}
            className={`px-2 py-1 rounded text-[11px] transition-colors flex items-center gap-1 cursor-pointer ${
              sourceFilter === "schedule"
                ? "bg-background text-foreground font-medium shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Repeat className="size-2.5 opacity-60" aria-hidden="true" />
            <span>Schedule</span>
          </button>
        </div>

        {/* Specific Schedule Filter Dropdown */}
        {schedules.length > 0 && (sourceFilter === "schedule" || sourceFilter === "all") && (
          <div className="flex items-center text-xs">
            <Select
              items={scheduleFilterItems}
              value={selectedScheduleFilter}
              onValueChange={(val) => {
                if (val) onScheduleFilterChange(val);
              }}
            >
              <SelectTrigger size="sm" className="h-7 text-[11px] font-medium min-w-32 bg-background">
                <SelectValue placeholder="All Schedules" />
              </SelectTrigger>
              <SelectContent>
                {scheduleFilterItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* View Mode Switcher */}
        <div
          role="radiogroup"
          aria-label="Select calendar view mode"
          className="flex items-center rounded-md border border-border bg-muted/50 p-0.5 text-xs font-medium"
        >
          {sourceFilter !== "schedule" && (
            <button
              type="button"
              role="radio"
              aria-checked={viewMode === "month"}
              onClick={() => onViewModeChange("month")}
              className={`px-2.5 py-1 rounded text-[11px] transition-colors cursor-pointer ${
                viewMode === "month"
                  ? "bg-primary text-primary-foreground font-medium shadow-2xs"
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
                role="radio"
                aria-checked={viewMode === "week"}
                onClick={() => onViewModeChange("week")}
                className={`px-2.5 py-1 rounded text-[11px] transition-colors cursor-pointer ${
                  viewMode === "week"
                    ? "bg-primary text-primary-foreground font-medium shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Week
              </button>
              {sourceFilter !== "schedule" && (
                <button
                  type="button"
                  role="radio"
                  aria-checked={viewMode === "day"}
                  onClick={() => onViewModeChange("day")}
                  className={`px-2.5 py-1 rounded text-[11px] transition-colors cursor-pointer ${
                    viewMode === "day"
                      ? "bg-primary text-primary-foreground font-medium shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Day
                </button>
              )}
            </>
          )}
        </div>

        {/* Zoom In / Out Controls */}
        {(sourceFilter === "schedule" || viewMode !== "month") && (onZoomIn || onZoomOut) && (
          <div
            role="group"
            aria-label="Timeline zoom controls"
            className="flex items-center gap-0.5 bg-muted/50 rounded-md border border-border p-0.5"
          >
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={onZoomOut}
              disabled={zoomLevel === 50}
              aria-label="Zoom out"
              title="Zoom out"
              className="size-6.5 rounded text-muted-foreground hover:text-foreground transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ZoomOut className="size-3" />
            </Button>
            <span
              className="min-w-[40px] px-1 text-center font-mono text-[11px] font-medium text-foreground select-none tracking-tight"
              aria-live="polite"
              aria-label={`Zoom level ${zoomLevel}%`}
            >
              {zoomLevel}%
            </span>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={onZoomIn}
              disabled={zoomLevel === 150}
              aria-label="Zoom in"
              title="Zoom in"
              className="size-6.5 rounded text-muted-foreground hover:text-foreground transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ZoomIn className="size-3" />
            </Button>
          </div>
        )}

        {/* Action Button */}
        <Button
          size="sm"
          onClick={onOpenAddModal}
          aria-label="Add new event or schedule item"
          className="h-7 px-2.5 rounded-md gap-1 font-medium text-xs cursor-pointer shadow-2xs"
        >
          <Plus className="size-3" aria-hidden="true" />
          <span>New Item</span>
        </Button>
      </div>
    </div>
  );
}

export default CalendarToolbar;
