"use client";

import * as React from "react";
import { useState } from "react";
import { Schedule } from "@/types/schedule";
import { createScheduleApi } from "@/lib/api/schedule";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Loader2, CalendarRange } from "lucide-react";

export interface AddScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScheduleCreated: (schedule: Schedule) => void;
}

export function AddScheduleModal({
  isOpen,
  onClose,
  onScheduleCreated,
}: AddScheduleModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError("Schedule title is required.");
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const res = await createScheduleApi({
        title: title.trim(),
        description: description.trim() || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      });

      if (res.success && res.data) {
        const newSched = Array.isArray(res.data) ? res.data[0] : res.data;
        onScheduleCreated(newSched);
        setTitle("");
        setDescription("");
        setStartDate("");
        setEndDate("");
        onClose();
      } else {
        setFormError(res.error || "Failed to create schedule.");
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to create schedule.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="add_sched_modal_title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
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

        <div className="flex items-center gap-2.5">
          <div className="size-7 rounded-md bg-muted text-foreground flex items-center justify-center">
            <CalendarRange className="size-3.5" />
          </div>
          <div>
            <h3 id="add_sched_modal_title" className="text-sm font-semibold text-foreground">
              New Schedule
            </h3>
            <p className="text-xs text-muted-foreground">
              Create a schedule for recurring routines and events.
            </p>
          </div>
        </div>

        {formError && (
          <div role="alert" className="p-2.5 text-xs font-medium bg-destructive/10 text-destructive border border-destructive/20 rounded-md">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 text-left">
          <div className="space-y-1">
            <label htmlFor="sched_title_input" className="text-xs font-medium text-foreground">
              Schedule Title
            </label>
            <Input
              id="sched_title_input"
              type="text"
              placeholder="e.g. Work Week, University Term"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
              className="h-8 rounded-md"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="sched_desc_input" className="text-xs font-medium text-foreground">
              Description (Optional)
            </label>
            <Input
              id="sched_desc_input"
              type="text"
              placeholder="Notes or details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-8 rounded-md"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label htmlFor="sched_start_date" className="text-xs font-medium text-foreground">
                Start Date (Optional)
              </label>
              <Input
                id="sched_start_date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-8 rounded-md"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="sched_end_date" className="text-xs font-medium text-foreground">
                End Date (Optional)
              </label>
              <Input
                id="sched_end_date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-8 rounded-md"
              />
            </div>
          </div>

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
                  Creating...
                </>
              ) : (
                "Create Schedule"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddScheduleModal;
