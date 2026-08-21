"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { CalendarItem } from "@/types/calendar-item";
import { Schedule, ScheduleItem, DayOfWeek } from "@/types/schedule";
import { Category } from "@/types/category";

import { createCalendarItemApi } from "@/lib/api/calendar-item";
import { createScheduleItemApi, ScheduleConflictError, ScheduleConflict } from "@/lib/api/schedule-item";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar as CalendarIcon, Repeat, X, Loader2, AlertTriangle, Clock } from "lucide-react";

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
  onScheduleItemCreated,
}: AddEventModalProps) {
  const [mounted, setMounted] = useState(false);
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

  const categorySelectItems = React.useMemo(() => [
    { label: "No Category", value: "none" },
    ...categories.map((c) => ({ label: c.name, value: c.id })),
  ], [categories]);

  const scheduleSelectItems = React.useMemo(() => [
    ...schedules.map((s) => ({ label: s.title, value: s.id })),
  ], [schedules]);

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

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="add_event_title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-md rounded-lg border border-border bg-card text-card-foreground p-5 shadow-lg z-10 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-98 duration-150 space-y-3.5">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close add item dialog"
          className="absolute top-3.5 right-3.5 p-1 rounded-md text-muted-foreground/70 hover:text-foreground hover:bg-muted/70 transition-colors cursor-pointer"
        >
          <X className="size-4" />
        </button>

        <h3 id="add_event_title" className="sr-only">
          {formType === "calendar_item" ? "Create Calendar Event" : "Create Recurring Schedule Item"}
        </h3>

        {/* Form Type Segmented Switcher */}
        <div
          role="radiogroup"
          aria-label="Choose item type"
          className="flex items-center gap-0.5 bg-muted/50 p-0.5 rounded-md border border-border"
        >
          <button
            type="button"
            role="radio"
            aria-checked={formType === "calendar_item"}
            onClick={() => setFormType("calendar_item")}
            className={`flex-1 py-1.5 text-xs font-medium rounded transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
              formType === "calendar_item"
                ? "bg-background text-foreground shadow-2xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <CalendarIcon className="size-3 opacity-70" aria-hidden="true" />
            <span>Single Event</span>
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={formType === "schedule_item"}
            onClick={() => setFormType("schedule_item")}
            className={`flex-1 py-1.5 text-xs font-medium rounded transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
              formType === "schedule_item"
                ? "bg-background text-foreground shadow-2xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Repeat className="size-3 opacity-70" aria-hidden="true" />
            <span>Recurring Routine</span>
          </button>
        </div>

        {formError && (
          <div role="alert" className="p-2.5 text-xs font-medium bg-destructive/10 text-destructive border border-destructive/20 rounded-md">
            {formError}
          </div>
        )}

        {conflictWarnings.length > 0 && (
          <div role="alert" className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
              <AlertTriangle className="size-3.5 shrink-0" />
              <span>Schedule Conflict — overlapping times</span>
            </div>
            <div className="space-y-1">
              {conflictWarnings.map((c) => (
                <div
                  key={c.id}
                  className="rounded border border-amber-500/20 bg-background/90 px-2 py-1.5 text-xs space-y-0.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-foreground truncate">{c.title}</span>
                    <span className="shrink-0 text-[10px] font-mono text-muted-foreground bg-muted px-1 rounded flex items-center gap-0.5">
                      <Clock className="size-2.5" />
                      {c.start_time} – {c.end_time}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground text-[10px]">
                    <span>in <strong className="text-foreground">{c.schedule_title}</strong></span>
                    <span>·</span>
                    <span>{c.overlapping_days.join(", ")}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="space-y-3 text-left">
          {formType === "calendar_item" ? (
            <>
              <div className="space-y-1">
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
                  className="h-8 rounded-md"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="event_day" className="text-xs font-medium text-foreground">
                  Date
                </label>
                <DatePicker
                  id="event_day"
                  date={eventDay}
                  onDateChange={(d) => setEventDay(d)}
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="event_desc" className="text-xs font-medium text-foreground">
                  Description (Optional)
                </label>
                <Input
                  id="event_desc"
                  type="text"
                  placeholder="Add notes..."
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                  className="h-8 rounded-md"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label htmlFor="event_start" className="text-xs font-medium text-foreground">
                    Start Time
                  </label>
                  <Input
                    id="event_start"
                    type="time"
                    value={eventStartTime}
                    onChange={(e) => setEventStartTime(e.target.value)}
                    className="h-8 rounded-md"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="event_end" className="text-xs font-medium text-foreground">
                    End Time
                  </label>
                  <Input
                    id="event_end"
                    type="time"
                    value={eventEndTime}
                    onChange={(e) => setEventEndTime(e.target.value)}
                    className="h-8 rounded-md"
                  />
                </div>
              </div>

              {categories.length > 0 && (
                <div className="space-y-1">
                  <label htmlFor="event_cat" className="text-xs font-medium text-foreground">
                    Category
                  </label>
                  <Select
                    items={categorySelectItems}
                    value={eventCategoryId || "none"}
                    onValueChange={(val) => setEventCategoryId(val === "none" ? "" : (val || ""))}
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
            </>
          ) : (
            <>
              <div className="space-y-1">
                <label htmlFor="sched_select" className="text-xs font-medium text-foreground">
                  Target Schedule
                </label>
                <Select
                  items={scheduleSelectItems}
                  value={selectedScheduleId}
                  onValueChange={(val) => {
                    if (val) setSelectedScheduleId(val);
                  }}
                  disabled={schedules.length === 0}
                >
                  <SelectTrigger className="h-8 w-full bg-background text-xs font-medium">
                    <SelectValue placeholder={schedules.length === 0 ? "No schedules available" : "Select schedule"} />
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
                <label htmlFor="sched_item_title" className="text-xs font-medium text-foreground">
                  Routine Title
                </label>
                <Input
                  id="sched_item_title"
                  type="text"
                  placeholder="e.g. Team Standup, Deep Work"
                  value={schedItemTitle}
                  onChange={(e) => setSchedItemTitle(e.target.value)}
                  required
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
                  <label htmlFor="sched_start" className="text-xs font-medium text-foreground">
                    Start Time
                  </label>
                  <Input
                    id="sched_start"
                    type="time"
                    value={schedStartTime}
                    onChange={(e) => setSchedStartTime(e.target.value)}
                    required
                    className="h-8 rounded-md"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="sched_end" className="text-xs font-medium text-foreground">
                    End Time
                  </label>
                  <Input
                    id="sched_end"
                    type="time"
                    value={schedEndTime}
                    onChange={(e) => setSchedEndTime(e.target.value)}
                    required
                    className="h-8 rounded-md"
                  />
                </div>
              </div>

              {categories.length > 0 && (
                <div className="space-y-1">
                  <label htmlFor="sched_cat" className="text-xs font-medium text-foreground">
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
            </>
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
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
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
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

export default AddEventModal;
