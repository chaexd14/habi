"use client";

import * as React from "react";
import { useState } from "react";
import { CalendarItem } from "@/types/calendar-item";
import { Schedule, ScheduleItem, DayOfWeek } from "@/types/schedule";
import { Category } from "@/types/category";

import { createCalendarItemApi } from "@/lib/api/calendar-item";
import { createScheduleApi } from "@/lib/api/schedule";
import { createScheduleItemApi } from "@/lib/api/schedule-item";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar as CalendarIcon, Repeat, X, Loader2 } from "lucide-react";

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
  onScheduleCreated: (schedule: Schedule) => void;
  onScheduleItemCreated: (item: ScheduleItem) => void;
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
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>(
    schedules.length > 0 ? schedules[0].id : "NEW"
  );
  const [newScheduleTitle, setNewScheduleTitle] = useState("");
  const [schedItemTitle, setSchedItemTitle] = useState("");
  const [schedSelectedDays, setSchedSelectedDays] = useState<DayOfWeek[]>(["MON", "WED", "FRI"]);
  const [schedStartTime, setSchedStartTime] = useState("09:00");
  const [schedEndTime, setSchedEndTime] = useState("17:00");
  const [schedCategoryId, setSchedCategoryId] = useState<string>("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleSchedDay = (day: DayOfWeek) => {
    setSchedSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
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

        let targetScheduleId = selectedScheduleId;

        if (!targetScheduleId || targetScheduleId === "NEW") {
          if (!newScheduleTitle.trim()) {
            setFormError("Please enter a title for the new schedule.");
            setIsSubmitting(false);
            return;
          }

          const schedRes = await createScheduleApi({
            title: newScheduleTitle.trim(),
          });

          if (schedRes.success && schedRes.data) {
            const createdSched = Array.isArray(schedRes.data) ? schedRes.data[0] : schedRes.data;
            onScheduleCreated(createdSched);
            targetScheduleId = createdSched.id;
            setSelectedScheduleId(createdSched.id);
          } else {
            setFormError(schedRes.error || "Failed to create parent schedule.");
            setIsSubmitting(false);
            return;
          }
        }

        const res = await createScheduleItemApi({
          schedule_id: targetScheduleId,
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
    } catch (err) {
      console.error("Form Submit Error:", err);
      setFormError(err instanceof Error ? err.message : "Error creating item.");
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

        <div className="flex items-center gap-1 bg-muted p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setFormType("calendar_item")}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              formType === "calendar_item"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <CalendarIcon className="size-3.5 text-primary" />
            Calendar Event
          </button>
          <button
            type="button"
            onClick={() => setFormType("schedule_item")}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              formType === "schedule_item"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
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

        <form onSubmit={handleFormSubmit} className="space-y-4 text-left">
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
                  className="h-10 bg-background"
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
                  className="h-10 bg-background"
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
                  className="h-10 bg-background"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label htmlFor="event_start" className="text-xs font-medium text-foreground">
                    Start Time
                  </label>
                  <Input
                    id="event_start"
                    type="time"
                    value={eventStartTime}
                    onChange={(e) => setEventStartTime(e.target.value)}
                    className="h-10 bg-background"
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
                    className="h-10 bg-background"
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
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-xs shadow-xs outline-none focus-visible:border-ring dark:bg-input/30"
                >
                  {schedules.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title}
                    </option>
                  ))}
                  <option value="NEW">+ Create New Schedule...</option>
                </select>
              </div>

              {(selectedScheduleId === "NEW" || !selectedScheduleId || schedules.length === 0) && (
                <div className="space-y-1.5">
                  <label htmlFor="new_sched_title" className="text-xs font-medium text-foreground">
                    New Schedule Title
                  </label>
                  <Input
                    id="new_sched_title"
                    type="text"
                    placeholder="e.g. Work Week Schedule"
                    value={newScheduleTitle}
                    onChange={(e) => setNewScheduleTitle(e.target.value)}
                    required
                    className="h-10 bg-background"
                  />
                </div>
              )}

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
            </>
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
