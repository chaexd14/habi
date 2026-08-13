"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { CalendarItem } from "@/types/calendar-item";
import { Schedule, ScheduleItem, DayOfWeek } from "@/types/schedule";
import { Category } from "@/types/category";

import { updateCalendarItemApi, deleteCalendarItemApi } from "@/lib/api/calendar-item";
import { updateScheduleItemApi, deleteScheduleItemApi } from "@/lib/api/schedule-item";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar as CalendarIcon, Repeat, X, Loader2, Trash2 } from "lucide-react";

export type RenderEvent = {
  id: string;
  rawId: string;
  type: "calendar_item" | "schedule_item";
  title: string;
  description?: string | null;
  dateIso: string;
  startTime?: string | null;
  endTime?: string | null;
  categoryId?: string | null;
  scheduleId?: string;
  scheduleTitle?: string;
};

const DAY_CODES: { code: DayOfWeek; label: string }[] = [
  { code: "MON", label: "Mon" },
  { code: "TUE", label: "Tue" },
  { code: "WED", label: "Wed" },
  { code: "THU", label: "Thu" },
  { code: "FRI", label: "Fri" },
  { code: "SAT", label: "Sat" },
  { code: "SUN", label: "Sun" },
];

export interface EditEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: RenderEvent | null;
  scheduleItems: ScheduleItem[];
  schedules: Schedule[];
  categories: Category[];
  onCalendarItemUpdated: (item: CalendarItem) => void;
  onCalendarItemDeleted: (id: string) => void;
  onScheduleItemUpdated: (item: ScheduleItem) => void;
  onScheduleItemDeleted: (id: string) => void;
}

export function EditEventModal({
  isOpen,
  onClose,
  item,
  scheduleItems,
  schedules,
  categories,
  onCalendarItemUpdated,
  onCalendarItemDeleted,
  onScheduleItemUpdated,
  onScheduleItemDeleted,
}: EditEventModalProps) {
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDay, setEditDay] = useState("");
  const [editStartTime, setEditStartTime] = useState("09:00");
  const [editEndTime, setEditEndTime] = useState("10:00");
  const [editCategoryId, setEditCategoryId] = useState("");
  const [editScheduleId, setEditScheduleId] = useState("");
  const [editSelectedDays, setEditSelectedDays] = useState<DayOfWeek[]>(["MON"]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!item) return;

    setFormError(null);
    setEditTitle(item.title);
    setEditDescription(item.description || "");
    setEditDay(item.dateIso);
    setEditStartTime(item.startTime || "09:00");
    setEditEndTime(item.endTime || "10:00");
    setEditCategoryId(item.categoryId || "");
    setEditScheduleId(item.scheduleId || "");

    if (item.type === "schedule_item") {
      const sItem = scheduleItems.find((s) => s.id === item.rawId);
      if (sItem && Array.isArray(sItem.days)) {
        setEditSelectedDays(sItem.days);
      } else {
        setEditSelectedDays(["MON"]);
      }
    }
  }, [item, scheduleItems]);

  if (!isOpen || !item) return null;

  const toggleEditSchedDay = (day: DayOfWeek) => {
    setEditSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleEditSave = async () => {
    if (!editTitle.trim()) {
      setFormError("Title is required.");
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      if (item.type === "schedule_item") {
        if (editSelectedDays.length === 0) {
          setFormError("Select at least one recurring day.");
          setIsSubmitting(false);
          return;
        }

        const res = await updateScheduleItemApi(item.rawId, {
          title: editTitle.trim(),
          days: editSelectedDays,
          start_time: editStartTime,
          end_time: editEndTime,
          category_id: editCategoryId || null,
          schedule_id: editScheduleId || undefined,
        });

        if (res.success && res.data) {
          const updated: ScheduleItem = Array.isArray(res.data) ? res.data[0] : res.data;
          onScheduleItemUpdated(updated);
          onClose();
        } else {
          setFormError(res.error || "Failed to update schedule item.");
        }
      } else {
        const res = await updateCalendarItemApi(item.rawId, {
          title: editTitle.trim(),
          description: editDescription.trim() || null,
          day: editDay,
          start_time: editStartTime || null,
          end_time: editEndTime || null,
          category_id: editCategoryId || null,
        });

        if (res.success && res.data) {
          const updated: CalendarItem = Array.isArray(res.data) ? res.data[0] : res.data;
          onCalendarItemUpdated(updated);
          onClose();
        } else {
          setFormError(res.error || "Failed to update calendar event.");
        }
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to update item.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditDelete = async () => {
    setIsDeleting(true);
    setFormError(null);

    try {
      if (item.type === "schedule_item") {
        await deleteScheduleItemApi(item.rawId);
        onScheduleItemDeleted(item.rawId);
      } else {
        await deleteCalendarItemApi(item.rawId);
        onCalendarItemDeleted(item.rawId);
      }
      onClose();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to delete item.");
    } finally {
      setIsDeleting(false);
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

        <div>
          <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
            {item.type === "schedule_item" ? (
              <>
                <Repeat className="size-5 text-blue-500" /> Edit Schedule Item
              </>
            ) : (
              <>
                <CalendarIcon className="size-5 text-primary" /> Edit Calendar Event
              </>
            )}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Update details or remove this item from your schedule.
          </p>
        </div>

        {formError && (
          <div className="p-3 text-xs font-medium bg-destructive/10 text-destructive border border-destructive/20 rounded-xl">
            {formError}
          </div>
        )}

        <div className="space-y-4 text-left">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Title</label>
            <Input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="h-10 bg-background"
            />
          </div>

          {item.type === "schedule_item" ? (
            <>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Recurring Days</label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {DAY_CODES.map((d) => {
                    const isSelected = editSelectedDays.includes(d.code);
                    return (
                      <button
                        key={d.code}
                        type="button"
                        onClick={() => toggleEditSchedDay(d.code)}
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

              {schedules.length > 0 && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Parent Schedule</label>
                  <select
                    value={editScheduleId}
                    onChange={(e) => setEditScheduleId(e.target.value)}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-xs shadow-xs outline-none focus-visible:border-ring dark:bg-input/30"
                  >
                    {schedules.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Date</label>
                <Input
                  type="date"
                  value={editDay}
                  onChange={(e) => setEditDay(e.target.value)}
                  className="h-10 bg-background"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Description (Optional)</label>
                <Input
                  type="text"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="h-10 bg-background"
                />
              </div>
            </>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Start Time</label>
              <Input
                type="time"
                value={editStartTime}
                onChange={(e) => setEditStartTime(e.target.value)}
                className="h-10 bg-background"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">End Time</label>
              <Input
                type="time"
                value={editEndTime}
                onChange={(e) => setEditEndTime(e.target.value)}
                className="h-10 bg-background"
              />
            </div>
          </div>

          {categories.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Category</label>
              <select
                value={editCategoryId}
                onChange={(e) => setEditCategoryId(e.target.value)}
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
        </div>

        <div className="flex items-center justify-between gap-3 pt-2">
          <Button
            type="button"
            variant="destructive"
            onClick={handleEditDelete}
            disabled={isDeleting || isSubmitting}
            className="gap-1.5 font-semibold"
          >
            {isDeleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
            Delete
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting || isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleEditSave}
              disabled={isSubmitting || isDeleting}
              className="gap-1.5 font-semibold"
            >
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
