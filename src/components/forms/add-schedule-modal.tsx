"use client";

import * as React from "react";
import { useState } from "react";
import { Schedule } from "@/types/schedule";
import { createScheduleApi } from "@/lib/api/schedule";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Repeat, X, Loader2 } from "lucide-react";

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
      setFormError("Title is required.");
      return;
    }

    setFormError(null);
    setIsSubmitting(true);

    try {
      const res = await createScheduleApi({
        title: title.trim(),
        description: description.trim() || null,
        start_date: startDate || null,
        end_date: endDate || null,
      });

      if (res.success && res.data) {
        const newSchedule: Schedule = Array.isArray(res.data) ? res.data[0] : res.data;
        onScheduleCreated(newSchedule);
        setTitle("");
        setDescription("");
        setStartDate("");
        setEndDate("");
        onClose();
      } else {
        setFormError(res.error || "Failed to create schedule.");
      }
    } catch (err) {
      console.error("Create Schedule Error:", err);
      setFormError(err instanceof Error ? err.message : "Failed to create schedule.");
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
      <div className="relative w-full max-w-md rounded-2xl border border-border/80 bg-card text-card-foreground p-6 shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-200 space-y-4">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-muted-foreground/70 hover:text-foreground hover:bg-muted/60 transition-colors"
        >
          <X className="size-4" />
        </button>

        <div className="flex items-center gap-2 font-bold text-base sm:text-lg text-foreground">
          <Repeat className="size-4.5 text-blue-500" />
          Create New Schedule
        </div>

        {formError && (
          <div className="p-3 text-xs font-medium bg-destructive/10 text-destructive border border-destructive/20 rounded-xl">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-left">
          <div className="space-y-1.5">
            <label htmlFor="sched_title" className="text-xs font-medium text-foreground">
              Schedule Title
            </label>
            <Input
              id="sched_title"
              type="text"
              placeholder="e.g. Work Week Schedule, Summer Term"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="sched_desc" className="text-xs font-medium text-foreground">
              Description (Optional)
            </label>
            <Input
              id="sched_desc"
              type="text"
              placeholder="Add notes or goals for this schedule..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1.5">
              <label htmlFor="sched_start_date" className="text-xs font-medium text-foreground">
                Start Date (Optional)
              </label>
              <Input
                id="sched_start_date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="sched_end_date" className="text-xs font-medium text-foreground">
                End Date (Optional)
              </label>
              <Input
                id="sched_end_date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

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
            <Button type="submit" size="sm" disabled={isSubmitting || !title.trim()}>
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
