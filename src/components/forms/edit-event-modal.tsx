"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { CalendarItem } from "@/types/calendar-item";
import { Schedule, ScheduleItem, DayOfWeek } from "@/types/schedule";
import { Category } from "@/types/category";

import { updateCalendarItemApi, deleteCalendarItemApi } from "@/lib/api/calendar-item";
import { updateScheduleItemApi, deleteScheduleItemApi } from "@/lib/api/schedule-item";

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
  const [mounted, setMounted] = useState(false);
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

  const categorySelectItems = React.useMemo(() => [
    { label: "No Category", value: "none" },
    ...categories.map((c) => ({ label: c.name, value: c.id })),
  ], [categories]);

  useEffect(() => {
    setMounted(true);
  }, []);

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
      if (sItem) {
        if (Array.isArray(sItem.days)) {
          setEditSelectedDays(sItem.days);
        }
        setEditCategoryId(sItem.category_id || item.categoryId || "");
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

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit_modal_title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
    >
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
      />

      <div className="relative w-full max-w-md rounded-lg border border-border bg-card text-card-foreground p-5 shadow-lg z-10 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-98 duration-150 space-y-3.5">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-3.5 right-3.5 p-1 rounded-md text-muted-foreground/70 hover:text-foreground hover:bg-muted/70 transition-colors cursor-pointer"
        >
          <X className="size-4" />
        </button>

        <div className="flex items-center gap-2">
          {item.type === "calendar_item" ? (
            <CalendarIcon className="size-4 opacity-70" />
          ) : (
            <Repeat className="size-4 opacity-70" />
          )}
          <h3 id="edit_modal_title" className="text-sm font-semibold text-foreground">
            {item.type === "calendar_item" ? "Edit Calendar Event" : "Edit Recurring Routine"}
          </h3>
        </div>

        {formError && (
          <div role="alert" className="p-2.5 text-xs font-medium bg-destructive/10 text-destructive border border-destructive/20 rounded-md">
            {formError}
          </div>
        )}

        <form onSubmit={(e) => { e.preventDefault(); handleEditSave(); }} className="space-y-3 text-left">
          <div className="space-y-1">
            <label htmlFor="edit_title_input" className="text-xs font-medium text-foreground">
              Title
            </label>
            <Input
              id="edit_title_input"
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              required
              className="h-8 rounded-md"
            />
          </div>

          {item.type === "calendar_item" ? (
            <>
              <div className="space-y-1">
                <label htmlFor="edit_day_input" className="text-xs font-medium text-foreground">
                  Date
                </label>
                <DatePicker
                  id="edit_day_input"
                  date={editDay}
                  onDateChange={(d) => setEditDay(d)}
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="edit_desc_input" className="text-xs font-medium text-foreground">
                  Description (Optional)
                </label>
                <Input
                  id="edit_desc_input"
                  type="text"
                  placeholder="Add notes..."
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="h-8 rounded-md"
                />
              </div>
            </>
          ) : (
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">Recurring Days</label>
              <div
                role="group"
                aria-label="Select recurring days"
                className="flex items-center gap-1 flex-wrap"
              >
                {DAY_CODES.map((d) => {
                  const isSelected = editSelectedDays.includes(d.code);
                  return (
                    <button
                      key={d.code}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => toggleEditSchedDay(d.code)}
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
          )}

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label htmlFor="edit_start_input" className="text-xs font-medium text-foreground">
                Start Time
              </label>
              <Input
                id="edit_start_input"
                type="time"
                value={editStartTime}
                onChange={(e) => setEditStartTime(e.target.value)}
                className="h-8 rounded-md"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="edit_end_input" className="text-xs font-medium text-foreground">
                End Time
              </label>
              <Input
                id="edit_end_input"
                type="time"
                value={editEndTime}
                onChange={(e) => setEditEndTime(e.target.value)}
                className="h-8 rounded-md"
              />
            </div>
          </div>

          {categories.length > 0 && (
            <div className="space-y-1">
              <label htmlFor="edit_cat_select" className="text-xs font-medium text-foreground">
                Category
              </label>
              <Select
                items={categorySelectItems}
                value={editCategoryId || "none"}
                onValueChange={(val) => setEditCategoryId(val === "none" ? "" : (val || ""))}
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
        </form>

        <div className="flex items-center justify-between pt-3 border-t border-border mt-4">
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleEditDelete}
            disabled={isDeleting || isSubmitting}
            className="rounded-md gap-1 font-medium cursor-pointer"
          >
            {isDeleting ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <Trash2 className="size-3.5" />
            )}
            <span>Delete</span>
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting || isDeleting}
              className="rounded-md font-medium cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleEditSave}
              disabled={isSubmitting || isDeleting}
              className="rounded-md gap-1 font-medium cursor-pointer"
            >
              {isSubmitting && <Loader2 className="size-3 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default EditEventModal;
