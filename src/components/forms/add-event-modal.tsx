"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { CalendarItem } from "@/types/calendar-item";
import { Schedule, ScheduleItem, DayOfWeek } from "@/types/schedule";
import { Category } from "@/types/category";

import { createCalendarItemApi } from "@/lib/api/calendar-item";
import { createScheduleItemApi, ScheduleConflictError, ScheduleConflict } from "@/lib/api/schedule-item";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar as CalendarIcon, Repeat, X, Loader2, AlertTriangle, Clock, Plus } from "lucide-react";

export type FormType = "calendar_item" | "schedule_item";

const DAY_CODES: { code: DayOfWeek; label: string }[] = [
  { code: "MON", label: "Mon" },
  { code: "TUE", label: "Tue" },
  { code: "WED", label: "Wed" },
  { code: "THU", label: "Thu" },
  { code: "FRI", label: "Fri" },
  { code: "SAT", label: "Sat" },
  { code: "SUN", label: "Sun" },
];

export interface AddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedules: Schedule[];
  categories: Category[];
  initialDayIso: string;
  onCalendarItemCreated: (item: CalendarItem) => void;
  onScheduleCreated?: (schedule: Schedule) => void;
  onScheduleItemCreated: (item: ScheduleItem) => void;
  onOpenCreateSchedule?: () => void;
}

export function AddEventModal({
  isOpen,
  onClose,
  schedules,
  categories,
  initialDayIso,
  onCalendarItemCreated,
  onScheduleCreated,
  onScheduleItemCreated,
  onOpenCreateSchedule,
}: AddEventModalProps) {
  const [formType, setFormType] = useState<FormType>("calendar_item");

  // Calendar Event Form
  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventDay, setEventDay] = useState(initialDayIso);
  const [eventStartTime, setEventStartTime] = useState("09:00");
  const [eventEndTime, setEventEndTime] = useState("10:00");
  const [eventCategoryId, setEventCategoryId] = useState<string>("");

  // Schedule Item Form
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

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setConflictWarnings([]);
    setIsSubmitting(true);

    try {
      if (formType === "calendar_item") {
        if (!eventTitle.trim() || !eventDay) {
          setFormError("Title and date are required.");
          setIsSubmitting(false);
          return;
        }

        const res = await createCalendarItemApi({
          title: eventTitle.trim(),
          description: eventDescription.trim() || null,
          day: eventDay,
          start_time: eventStartTime || null,
          end_time: eventEndTime || null,
          category_id: eventCategoryId || null,
        });

        if (res.success && res.data) {
          const newItem: CalendarItem = Array.isArray(res.data) ? res.data[0] : res.data;
          onCalendarItemCreated(newItem);
          setEventTitle("");
          setEventDescription("");
          onClose();
        } else {
          setFormError(res.error || "Failed to create calendar item.");
        }
      } else {
        if (!selectedScheduleId) {
          setFormError("Please select a schedule or create one first.");
          setIsSubmitting(false);
          return;
        }

        if (!schedItemTitle.trim()) {
          setFormError("Title is required.");
          setIsSubmitting(false);
          return;
        }

        if (schedSelectedDays.length === 0) {
          setFormError("Select at least one day for recurring schedule.");
          setIsSubmitting(false);
          return;
        }

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
      }
    } catch (err: unknown) {
      console.error("Form Submit Error:", err);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-md rounded-2xl border border-border/80 bg-card text-card-foreground p-6 shadow-2xl z-10 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200 space-y-4">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-muted-foreground/70 hover:text-foreground hover:bg-muted/60 transition-colors"
        >
          <X className="size-4" />
        </button>

        {/* Form Type Segmented Tabs */}
        <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-xl border border-border/60">
          <button
            type="button"
            onClick={() => setFormType("calendar_item")}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              formType === "calendar_item"
                ? "bg-background text-foreground shadow-2xs font-bold"
                : "text-muted-foreground hover:text-foreground hover:bg-background/40"
            }`}
          >
            <CalendarIcon className="size-3.5 text-primary" />
            Calendar Event
          </button>
          <button
            type="button"
            onClick={() => setFormType("schedule_item")}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              formType === "schedule_item"
                ? "bg-background text-foreground shadow-2xs font-bold"
                : "text-muted-foreground hover:text-foreground hover:bg-background/40"
            }`}
          >
            <Repeat className="size-3.5 text-blue-500" />
            Recurring Schedule
          </button>
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

        <form onSubmit={handleFormSubmit} className="space-y-3.5 text-left">
          {formType === "calendar_item" ? (
            <>
              <div className="space-y-1.5">
                <label htmlFor="event_title" className="text-xs font-medium text-foreground">
                  Event Title
                </label>
                <Input
                  id="event_title"
                  type="text"
                  placeholder="e.g. Team Meeting, Doctor Visit"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="event_day" className="text-xs font-medium text-foreground">
                  Date
                </label>
                <Input
                  id="event_day"
                  type="date"
                  value={eventDay}
                  onChange={(e) => setEventDay(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="event_desc" className="text-xs font-medium text-foreground">
                  Description (Optional)
                </label>
                <Input
                  id="event_desc"
                  type="text"
                  placeholder="Add notes or details..."
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1.5">
                  <label htmlFor="event_start" className="text-xs font-medium text-foreground">
                    Start Time
                  </label>
                  <Input
                    id="event_start"
                    type="time"
                    value={eventStartTime}
                    onChange={(e) => setEventStartTime(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="event_end" className="text-xs font-medium text-foreground">
                    End Time
                  </label>
                  <Input
                    id="event_end"
                    type="time"
                    value={eventEndTime}
                    onChange={(e) => setEventEndTime(e.target.value)}
                  />
                </div>
              </div>

              {categories.length > 0 && (
                <div className="space-y-1.5">
                  <label htmlFor="event_cat" className="text-xs font-medium text-foreground">
                    Category
                  </label>
                  <select
                    id="event_cat"
                    value={eventCategoryId}
                    onChange={(e) => setEventCategoryId(e.target.value)}
                    className="h-9.5 w-full rounded-lg border border-border/80 bg-background px-3 text-xs shadow-2xs outline-none focus-visible:border-ring dark:bg-input/20 cursor-pointer"
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
            </>
          ) : (
            <>
              <div className="space-y-1.5">
                <label htmlFor="sched_select" className="text-xs font-medium text-foreground">
                  Target Schedule
                </label>
                <select
                  id="sched_select"
                  value={selectedScheduleId}
                  onChange={(e) => setSelectedScheduleId(e.target.value)}
                  className="h-9.5 w-full rounded-lg border border-border/80 bg-background px-3 text-xs shadow-2xs outline-none focus-visible:border-ring dark:bg-input/20 cursor-pointer"
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
                        className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary shadow-2xs font-bold"
                            : "bg-background text-muted-foreground border-border/80 hover:text-foreground hover:bg-muted/40"
                        }`}
                      >
                        {d.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
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
                    className="h-9.5 w-full rounded-lg border border-border/80 bg-background px-3 text-xs shadow-2xs outline-none focus-visible:border-ring dark:bg-input/20 cursor-pointer"
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
            </>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/50">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting}>
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

