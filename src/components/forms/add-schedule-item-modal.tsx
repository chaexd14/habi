"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { Schedule, ScheduleItem, DayOfWeek } from "@/types/schedule";
import { Category } from "@/types/category";

import {
  createScheduleItemApi,
  ScheduleConflictError,
  ScheduleConflict,
} from "@/lib/api/schedule-item";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Repeat, X, Loader2, AlertTriangle, Clock, Plus } from "lucide-react";

const DAY_CODES: { code: DayOfWeek; label: string }[] = [
  { code: "MON", label: "Mon" },
  { code: "TUE", label: "Tue" },
  { code: "WED", label: "Wed" },
  { code: "THU", label: "Thu" },
  { code: "FRI", label: "Fri" },
  { code: "SAT", label: "Sat" },
  { code: "SUN", label: "Sun" },
];

export interface AddScheduleItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedules: Schedule[];
  categories: Category[];
  onScheduleItemCreated: (item: ScheduleItem) => void;
  onOpenCreateSchedule?: () => void;
}

export function AddScheduleItemModal({
  isOpen,
  onClose,
  schedules,
  categories,
  onScheduleItemCreated,
  onOpenCreateSchedule,
}: AddScheduleItemModalProps) {
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>("");
  const [schedItemTitle, setSchedItemTitle] = useState("");
  const [schedSelectedDays, setSchedSelectedDays] = useState<DayOfWeek[]>(["MON", "WED", "FRI"]);
  const [schedStartTime, setSchedStartTime] = useState("09:00");
  const [schedEndTime, setSchedEndTime] = useState("17:00");
  const [schedCategoryId, setSchedCategoryId] = useState<string>("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [conflictWarnings, setConflictWarnings] = useState<ScheduleConflict[]>([]);

  useEffect(() => {
    if (schedules.length > 0) {
      if (!selectedScheduleId || !schedules.some((s) => s.id === selectedScheduleId)) {
        setSelectedScheduleId(schedules[0].id);
      }
    } else {
      setSelectedScheduleId("");
    }
  }, [schedules, isOpen]);

  if (!isOpen) return null;

  const toggleSchedDay = (day: DayOfWeek) => {
    setSchedSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setConflictWarnings([]);

    if (!selectedScheduleId) {
      setFormError("Please select a schedule or create one first.");
      return;
    }

    if (!schedItemTitle.trim()) {
      setFormError("Title is required.");
      return;
    }

    if (schedSelectedDays.length === 0) {
      setFormError("Select at least one recurring day.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await createScheduleItemApi({
        schedule_id: selectedScheduleId,
        title: schedItemTitle.trim(),
        days: schedSelectedDays,
        start_time: schedStartTime,
        end_time: schedEndTime,
        category_id: schedCategoryId || null,
      });

      if (res.success && res.data) {
        const newItem: ScheduleItem = Array.isArray(res.data) ? res.data[0] : res.data;
        onScheduleItemCreated(newItem);
        setSchedItemTitle("");
        onClose();
      } else {
        setFormError(res.error || "Failed to create schedule item.");
      }
    } catch (err: unknown) {
      console.error("Create Schedule Item Error:", err);
      const isConflict =
        err instanceof ScheduleConflictError ||
        (err instanceof Error && err.name === "ScheduleConflictError") ||
        (err instanceof Error && "conflicts" in err);

      if (isConflict && err instanceof Error && "conflicts" in err) {
        setConflictWarnings((err as ScheduleConflictError).conflicts);
        setFormError(err.message);
      } else {
        setFormError(err instanceof Error ? err.message : "Error creating item.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-5 relative max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        >
          <X className="size-5" />
        </button>

        <div className="flex items-center gap-2 font-bold text-lg text-foreground">
          <Repeat className="size-5 text-blue-500" />
          Add Schedule Item
        </div>

        {formError && (
          <div className="p-3 text-xs font-medium bg-destructive/10 text-destructive border border-destructive/20 rounded-xl">
            {formError}
          </div>
        )}

        {conflictWarnings.length > 0 && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
              <AlertTriangle className="size-3.5" />
              Schedule Conflict — overlapping times detected
            </div>
            <div className="space-y-1.5">
              {conflictWarnings.map((c) => (
                <div
                  key={c.id}
                  className="rounded-lg border border-amber-500/20 bg-background/80 px-3 py-2 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-foreground truncate">{c.title}</span>
                    <span className="shrink-0 text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded flex items-center gap-1">
                      <Clock className="size-2.5" />
                      {c.start_time} – {c.end_time}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span className="text-[10px]">in <strong className="text-foreground">{c.schedule_title}</strong></span>
                    <span className="text-[10px]">·</span>
                    <span className="text-[10px]">{c.overlapping_days.join(", ")}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div className="space-y-1.5">
            <label htmlFor="sched_select" className="text-xs font-medium text-foreground">
              Target Schedule
            </label>
            <select
              id="sched_select"
              value={selectedScheduleId}
              onChange={(e) => setSelectedScheduleId(e.target.value)}
              required
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-xs shadow-xs outline-none focus-visible:border-ring dark:bg-input/30"
            >
              {schedules.length === 0 ? (
                <option value="">No schedules available. Create one first!</option>
              ) : (
                schedules.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="sched_item_title" className="text-xs font-medium text-foreground">
              Schedule Item Title
            </label>
            <Input
              id="sched_item_title"
              type="text"
              placeholder="e.g. Morning Standup, Daily Workout"
              value={schedItemTitle}
              onChange={(e) => setSchedItemTitle(e.target.value)}
              required
              className="h-10 bg-background"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Recurring Days</label>
            <div className="flex items-center gap-1.5 flex-wrap">
              {DAY_CODES.map((d) => {
                const isSelected = schedSelectedDays.includes(d.code);
                return (
                  <button
                    key={d.code}
                    type="button"
                    onClick={() => toggleSchedDay(d.code)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md border transition-all ${
                      isSelected
                        ? "bg-primary text-white border-primary shadow-xs"
                        : "bg-background text-muted-foreground border-border hover:text-foreground"
                    }`}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="sched_start" className="text-xs font-medium text-foreground">
                Start Time
              </label>
              <Input
                id="sched_start"
                type="time"
                value={schedStartTime}
                onChange={(e) => setSchedStartTime(e.target.value)}
                required
                className="h-10 bg-background"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="sched_end" className="text-xs font-medium text-foreground">
                End Time
              </label>
              <Input
                id="sched_end"
                type="time"
                value={schedEndTime}
                onChange={(e) => setSchedEndTime(e.target.value)}
                required
                className="h-10 bg-background"
              />
            </div>
          </div>

          {categories.length > 0 && (
            <div className="space-y-1.5">
              <label htmlFor="sched_cat" className="text-xs font-medium text-foreground">
                Category
              </label>
              <select
                id="sched_cat"
                value={schedCategoryId}
                onChange={(e) => setSchedCategoryId(e.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-xs shadow-xs outline-none focus-visible:border-ring dark:bg-input/30"
              >
                <option value="">No Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting || !selectedScheduleId}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Item"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
