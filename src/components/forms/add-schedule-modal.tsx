"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Schedule } from "@/types/schedule";
import { createScheduleApi } from "@/lib/api/schedule";
import { useSchedule } from "@/providers/schedule-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { X, Loader2, CalendarRange, Clock, CalendarDays, CheckCircle2 } from "lucide-react";

export type DurationOption = "3" | "7" | "14" | "custom_days" | "custom_range" | "ongoing";

export interface AddScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScheduleCreated: (schedule: Schedule) => void;
}

function getTodayIso(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = (d.getMonth() + 1).toString().padStart(2, "0");
  const dd = d.getDate().toString().padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function computeEndDate(startDateIso: string, durationDays: number): string {
  if (!startDateIso || durationDays < 1) return "";
  const parts = startDateIso.split("-");
  if (parts.length !== 3) return "";
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const d = new Date(year, month, day + durationDays - 1);
  const yyyy = d.getFullYear();
  const mm = (d.getMonth() + 1).toString().padStart(2, "0");
  const dd = d.getDate().toString().padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function AddScheduleModal({
  isOpen,
  onClose,
  onScheduleCreated,
}: AddScheduleModalProps) {
  const { addSchedule } = useSchedule();
  const [mounted, setMounted] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [durationOption, setDurationOption] = useState<DurationOption>("ongoing");
  const [customDaysCount, setCustomDaysCount] = useState("30");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Update End Date whenever start date or duration option changes
  useEffect(() => {
    if (durationOption === "ongoing") {
      setEndDate("");
      return;
    }

    const baseStart = startDate || getTodayIso();

    if (durationOption === "3") {
      setEndDate(computeEndDate(baseStart, 3));
    } else if (durationOption === "7") {
      setEndDate(computeEndDate(baseStart, 7));
    } else if (durationOption === "14") {
      setEndDate(computeEndDate(baseStart, 14));
    } else if (durationOption === "custom_days") {
      const days = parseInt(customDaysCount, 10);
      if (!isNaN(days) && days > 0) {
        setEndDate(computeEndDate(baseStart, days));
      }
    }
  }, [startDate, durationOption, customDaysCount]);

  if (!isOpen || !mounted) return null;

  const handleDurationSelect = (opt: DurationOption) => {
    setDurationOption(opt);
    const baseStart = startDate || getTodayIso();
    if (opt === "3") {
      if (!startDate) setStartDate(baseStart);
      setEndDate(computeEndDate(baseStart, 3));
    } else if (opt === "7") {
      if (!startDate) setStartDate(baseStart);
      setEndDate(computeEndDate(baseStart, 7));
    } else if (opt === "14") {
      if (!startDate) setStartDate(baseStart);
      setEndDate(computeEndDate(baseStart, 14));
    } else if (opt === "custom_days") {
      if (!startDate) setStartDate(baseStart);
      const days = parseInt(customDaysCount, 10) || 30;
      setEndDate(computeEndDate(baseStart, days));
    } else if (opt === "custom_range") {
      if (!startDate) setStartDate(baseStart);
    } else if (opt === "ongoing") {
      setEndDate("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError("Schedule title is required.");
      return;
    }

    if (startDate && endDate && endDate < startDate) {
      setFormError("End date must be on or after start date.");
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const res = await createScheduleApi({
        title: title.trim(),
        description: description.trim() || undefined,
        start_date: durationOption === "ongoing" ? undefined : (startDate || undefined),
        end_date: durationOption === "ongoing" ? undefined : (endDate || undefined),
      });

      if (res.success && res.data) {
        const newSched = Array.isArray(res.data) ? res.data[0] : res.data;
        addSchedule(newSched);
        if (onScheduleCreated) {
          onScheduleCreated(newSched);
        }
        setTitle("");
        setDescription("");
        setDurationOption("ongoing");
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

  const isPlanned = Boolean(startDate && endDate);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="add_sched_modal_title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
    >
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
      />

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
            <CalendarRange className="size-4" />
          </div>
          <div>
            <h3 id="add_sched_modal_title" className="text-sm font-semibold text-foreground">
              Create New Schedule
            </h3>
            <p className="text-xs text-muted-foreground">
              Set up a planned schedule duration or an ongoing recurring schedule.
            </p>
          </div>
        </div>

        {formError && (
          <div role="alert" className="p-2.5 text-xs font-medium bg-destructive/10 text-destructive border border-destructive/20 rounded-md">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div className="space-y-1">
            <label htmlFor="sched_title_input" className="text-xs font-medium text-foreground">
              Schedule Title <span className="text-destructive">*</span>
            </label>
            <Input
              id="sched_title_input"
              type="text"
              placeholder="e.g. 2-Week Sprint, Spring Term, Routine"
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
              placeholder="Goals or notes for this schedule..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-8 rounded-md"
            />
          </div>

          {/* Schedule Duration Options */}
          <div className="space-y-2 pt-1 border-t border-border">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                <Clock className="size-3.5 text-muted-foreground" />
                <span>Schedule Duration / Mode</span>
              </label>
              {isPlanned ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="size-3" />
                  Planned Schedule
                </span>
              ) : (
                <span className="text-[11px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  Ongoing Schedule
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
              {[
                { id: "3", label: "3 Days" },
                { id: "7", label: "7 Days (1W)" },
                { id: "14", label: "14 Days (2W)" },
                { id: "custom_days", label: "Custom Days" },
                { id: "custom_range", label: "Date Range" },
                { id: "ongoing", label: "Ongoing" },
              ].map((item) => {
                const isSelected = durationOption === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleDurationSelect(item.id as DurationOption)}
                    className={`py-1.5 px-2 text-xs font-medium rounded-md border transition-all cursor-pointer text-center ${
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary shadow-2xs font-semibold"
                        : "bg-background text-muted-foreground border-border hover:text-foreground hover:bg-muted/40"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>

            {durationOption === "custom_days" && (
              <div className="flex items-center gap-2 pt-1">
                <label htmlFor="custom_days_input" className="text-xs text-muted-foreground shrink-0">
                  Number of days:
                </label>
                <Input
                  id="custom_days_input"
                  type="number"
                  min={1}
                  max={365}
                  value={customDaysCount}
                  onChange={(e) => setCustomDaysCount(e.target.value)}
                  className="h-7 w-24 text-xs"
                />
                <span className="text-xs text-muted-foreground">days</span>
              </div>
            )}
          </div>

          {/* Date Picker Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label htmlFor="sched_start_date" className="text-xs font-medium text-foreground">
                Start Date
              </label>
              <DatePicker
                id="sched_start_date"
                date={startDate}
                onDateChange={(d) => setStartDate(d)}
                placeholder="Pick start date"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="sched_end_date" className="text-xs font-medium text-foreground flex items-center justify-between">
                <span>End Date</span>
                {durationOption !== "custom_range" && durationOption !== "ongoing" && (
                  <span className="text-[10px] text-muted-foreground font-normal">Auto-calculated</span>
                )}
              </label>
              <DatePicker
                id="sched_end_date"
                date={endDate}
                onDateChange={(d) => {
                  setEndDate(d);
                  if (durationOption !== "custom_range") {
                    setDurationOption("custom_range");
                  }
                }}
                disabled={durationOption === "ongoing"}
                placeholder={durationOption === "ongoing" ? "None (Ongoing)" : "Pick end date"}
              />
            </div>
          </div>

          {/* Date Preview Card */}
          <div className="rounded-lg border border-border bg-muted/40 p-2.5 text-xs text-muted-foreground flex items-center gap-2">
            <CalendarDays className="size-4 text-primary shrink-0" />
            <div className="truncate">
              {isPlanned ? (
                <span>
                  Active period: <strong className="text-foreground">{startDate}</strong> to <strong className="text-foreground">{endDate}</strong>
                </span>
              ) : (
                <span>
                  {startDate ? (
                    <>Recurring schedule starts on <strong className="text-foreground">{startDate}</strong> (ongoing routine).</>
                  ) : (
                    <>Ongoing recurring weekly schedule (repeats indefinitely).</>
                  )}
                </span>
              )}
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
    </div>,
    document.body
  );
}

export default AddScheduleModal;

