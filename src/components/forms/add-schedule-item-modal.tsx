"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Schedule, ScheduleItem, DayOfWeek, ConflictDetail } from "@/types/schedule";
import { CalendarItem } from "@/types/calendar-item";
import { Category } from "@/types/category";

import {
  createScheduleItemApi,
  ScheduleConflictError,
} from "@/lib/api/schedule-item";
import { useSchedule } from "@/providers/schedule-provider";
import { detectRoutineConflicts } from "@/lib/services/schedule-conflict";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Repeat, X, Loader2, AlertTriangle, Clock, ShieldAlert, Check } from "lucide-react";

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
  calendarItems?: CalendarItem[];
  scheduleItems?: ScheduleItem[];
  onScheduleItemCreated: (item: ScheduleItem) => void;
  onOpenCreateSchedule?: () => void;
}

export function AddScheduleItemModal({
  isOpen,
  onClose,
  schedules,
  categories,
  calendarItems = [],
  scheduleItems = [],
  onScheduleItemCreated,
  onOpenCreateSchedule,
}: AddScheduleItemModalProps) {
  const { addScheduleItem } = useSchedule();
  const [mounted, setMounted] = useState(false);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>("");
  const [schedItemTitle, setSchedItemTitle] = useState("");
  const [schedSelectedDays, setSchedSelectedDays] = useState<DayOfWeek[]>(["MON", "WED", "FRI"]);
  const [schedStartTime, setSchedStartTime] = useState("09:00");
  const [schedEndTime, setSchedEndTime] = useState("17:00");
  const [schedCategoryId, setSchedCategoryId] = useState<string>("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [conflictWarnings, setConflictWarnings] = useState<ConflictDetail[]>([]);
  const [pendingAllowConflict, setPendingAllowConflict] = useState(false);

  const scheduleSelectItems = React.useMemo(() => [
    ...schedules.map((s) => ({ label: s.title, value: s.id })),
  ], [schedules]);

  const categorySelectItems = React.useMemo(() => [
    { label: "No Category", value: "none" },
    ...categories.map((c) => ({ label: c.name, value: c.id })),
  ], [categories]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (schedules.length > 0) {
      if (!selectedScheduleId || !schedules.some((s) => s.id === selectedScheduleId)) {
        setSelectedScheduleId(schedules[0].id);
      }
    } else {
      setSelectedScheduleId("");
    }
  }, [schedules, isOpen]);

  if (!isOpen || !mounted) return null;

  const toggleSchedDay = (day: DayOfWeek) => {
    setConflictWarnings([]);
    setPendingAllowConflict(false);
    setSchedSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const executeSubmit = async (allowConflict = false) => {
    setFormError(null);
    setConflictWarnings([]);
    setPendingAllowConflict(false);

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

    const targetSched = schedules.find((s) => s.id === selectedScheduleId);

    // Client-side pre-check for conflicts
    if (!allowConflict) {
      const clientConflicts = detectRoutineConflicts({
        newItem: {
          schedule_id: selectedScheduleId,
          days: schedSelectedDays,
          start_time: schedStartTime,
          end_time: schedEndTime,
          title: schedItemTitle.trim(),
        },
        targetSchedule: targetSched,
        allSchedules: schedules,
        allScheduleItems: scheduleItems,
        allCalendarItems: calendarItems,
      });

      if (clientConflicts.length > 0) {
        setConflictWarnings(clientConflicts);
        setPendingAllowConflict(true);
        return;
      }
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
        allow_conflict: allowConflict,
      });

      if (res.success && res.data) {
        const newItem: ScheduleItem = Array.isArray(res.data) ? res.data[0] : res.data;
        addScheduleItem(newItem);
        if (onScheduleItemCreated) {
          onScheduleItemCreated(newItem);
        }
        setSchedItemTitle("");
        setConflictWarnings([]);
        setPendingAllowConflict(false);
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
        setPendingAllowConflict(true);
        setFormError(err.message);
      } else {
        setFormError(err instanceof Error ? err.message : "Error creating item.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await executeSubmit(conflictWarnings.length > 0);
  };


  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="add_sched_item_title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-lg rounded-xl border border-border bg-card text-card-foreground p-5 shadow-lg z-10 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-98 duration-150 space-y-4">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-3.5 right-3.5 p-1 rounded-md text-muted-foreground/70 hover:text-foreground hover:bg-muted/70 transition-colors cursor-pointer"
        >
          <X className="size-4" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Repeat className="size-4" />
          </div>
          <div>
            <h3 id="add_sched_item_title" className="text-sm font-semibold text-foreground">
              New Recurring Routine
            </h3>
            <p className="text-xs text-muted-foreground">
              Add a recurring routine block to your schedule.
            </p>
          </div>
        </div>

        {formError && !pendingAllowConflict && (
          <div role="alert" className="p-2.5 text-xs font-medium bg-destructive/10 text-destructive border border-destructive/20 rounded-md">
            {formError}
          </div>
        )}

        {/* Conflict Warning Alert Box */}
        {conflictWarnings.length > 0 && (
          <div role="alert" className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
              <AlertTriangle className="size-4 shrink-0" />
              <span>Schedule Conflict — overlapping routines or calendar events</span>
            </div>

            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {conflictWarnings.map((c, idx) => (
                <div
                  key={c.id || idx}
                  className="rounded-lg border border-amber-500/20 bg-background/90 p-2 text-xs space-y-1 shadow-2xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-medium text-foreground truncate">{c.title}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 font-medium">
                        {c.sourceType === "schedule_item" ? "Routine" : "Calendar Event"}
                      </span>
                    </div>
                    <span className="shrink-0 text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded flex items-center gap-1">
                      <Clock className="size-2.5" />
                      {c.start_time} – {c.end_time}
                    </span>
                  </div>

                  {c.message ? (
                    <p className="text-[11px] text-muted-foreground leading-tight">{c.message}</p>
                  ) : (
                    <div className="flex items-center gap-1.5 text-muted-foreground text-[10px]">
                      {c.scheduleTitle && <span>in <strong className="text-foreground">{c.scheduleTitle}</strong></span>}
                      {c.date && <span>· on <strong>{c.date}</strong></span>}
                      {c.days && <span>· {c.days.join(", ")}</span>}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-amber-500/20">
              <span className="text-[11px] text-muted-foreground">
                You can allow this conflict or adjust details below.
              </span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => executeSubmit(true)}
                disabled={isSubmitting}
                className="h-7 text-xs border-amber-500/40 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 rounded-md font-medium cursor-pointer"
              >
                {isSubmitting ? (
                  <Loader2 className="size-3 animate-spin mr-1" />
                ) : (
                  <ShieldAlert className="size-3 mr-1 text-amber-500" />
                )}
                Allow Conflict & Save
              </Button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-left">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label htmlFor="modal_sched_select" className="text-xs font-medium text-foreground">
                Target Schedule <span className="text-destructive">*</span>
              </label>
              {onOpenCreateSchedule && (
                <button
                  type="button"
                  onClick={onOpenCreateSchedule}
                  className="text-[11px] font-medium text-primary hover:underline cursor-pointer"
                >
                  + New Schedule
                </button>
              )}
            </div>
            <Select
              items={scheduleSelectItems}
              value={selectedScheduleId}
              onValueChange={(val) => {
                if (val) {
                  setSelectedScheduleId(val);
                  setConflictWarnings([]);
                }
              }}
              disabled={schedules.length === 0}
            >
              <SelectTrigger className="h-8 w-full bg-background text-xs font-medium">
                <SelectValue placeholder={schedules.length === 0 ? "No schedules available — create one first" : "Select schedule"} />
              </SelectTrigger>
              <SelectContent>
                {scheduleSelectItems.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label htmlFor="modal_sched_item_title" className="text-xs font-medium text-foreground">
              Routine Title <span className="text-destructive">*</span>
            </label>
            <Input
              id="modal_sched_item_title"
              type="text"
              placeholder="e.g. Deep Work, Gym Session"
              value={schedItemTitle}
              onChange={(e) => {
                setSchedItemTitle(e.target.value);
                setConflictWarnings([]);
              }}
              required
              autoFocus
              className="h-8 rounded-md"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">Recurring Days</label>
            <div
              role="group"
              aria-label="Select recurring days of the week"
              className="flex items-center gap-1 flex-wrap"
            >
              {DAY_CODES.map((d) => {
                const isSelected = schedSelectedDays.includes(d.code);
                return (
                  <button
                    key={d.code}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => toggleSchedDay(d.code)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-muted-foreground border-border hover:text-foreground hover:bg-muted/40"
                    }`}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label htmlFor="modal_sched_start" className="text-xs font-medium text-foreground">
                Start Time
              </label>
              <Input
                id="modal_sched_start"
                type="time"
                value={schedStartTime}
                onChange={(e) => {
                  setSchedStartTime(e.target.value);
                  setConflictWarnings([]);
                }}
                required
                className="h-8 rounded-md"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="modal_sched_end" className="text-xs font-medium text-foreground">
                End Time
              </label>
              <Input
                id="modal_sched_end"
                type="time"
                value={schedEndTime}
                onChange={(e) => {
                  setSchedEndTime(e.target.value);
                  setConflictWarnings([]);
                }}
                required
                className="h-8 rounded-md"
              />
            </div>
          </div>

          {categories.length > 0 && (
            <div className="space-y-1">
              <label htmlFor="modal_sched_cat" className="text-xs font-medium text-foreground">
                Category
              </label>
              <Select
                items={categorySelectItems}
                value={schedCategoryId || "none"}
                onValueChange={(val) => setSchedCategoryId(val === "none" ? "" : (val || ""))}
              >
                <SelectTrigger className="h-8 w-full bg-background text-xs font-medium">
                  <SelectValue placeholder="No Category" />
                </SelectTrigger>
                <SelectContent>
                  {categorySelectItems.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border mt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-md font-medium cursor-pointer"
            >
              Cancel
            </Button>

            {conflictWarnings.length > 0 ? (
              <Button
                type="button"
                size="sm"
                onClick={() => executeSubmit(true)}
                disabled={isSubmitting}
                className="rounded-md font-medium cursor-pointer bg-amber-600 hover:bg-amber-700 text-white"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="mr-1.5 size-3.5" />
                    Allow Conflict & Save
                  </>
                )}
              </Button>
            ) : (
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting || !selectedScheduleId}
                className="rounded-md font-medium cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Item"
                )}
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

export default AddScheduleItemModal;

