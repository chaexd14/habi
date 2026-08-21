"use client";

import * as React from "react";
import { format, parseISO, isValid } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface DatePickerProps {
  date?: Date | string;
  onDateChange?: (dateIso: string, dateObj?: Date) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  id?: string;
}

export function DatePicker({
  date,
  onDateChange,
  placeholder = "Pick a date",
  className,
  disabled = false,
  id,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  // Convert date string (YYYY-MM-DD) or Date to a valid local Date object
  const selectedDate: Date | undefined = React.useMemo(() => {
    if (!date) return undefined;
    if (date instanceof Date) return isValid(date) ? date : undefined;
    if (typeof date === "string" && date.trim()) {
      // Parse YYYY-MM-DD components directly to prevent timezone shift issues
      const parts = date.split("-");
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const d = new Date(year, month, day);
        return isValid(d) ? d : undefined;
      }
      try {
        const parsed = parseISO(date);
        return isValid(parsed) ? parsed : undefined;
      } catch {
        return undefined;
      }
    }
    return undefined;
  }, [date]);

  const handleSelect = (newDate: Date | undefined) => {
    if (newDate) {
      const year = newDate.getFullYear();
      const month = String(newDate.getMonth() + 1).padStart(2, "0");
      const day = String(newDate.getDate()).padStart(2, "0");
      const isoString = `${year}-${month}-${day}`;
      onDateChange?.(isoString, newDate);
    } else {
      onDateChange?.("", undefined);
    }
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        id={id}
        render={
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            data-empty={!selectedDate}
            className={cn(
              "h-8 w-full justify-start text-left text-xs font-normal bg-background border-border hover:bg-muted/40 cursor-pointer shadow-2xs gap-2 px-2.5",
              !selectedDate && "text-muted-foreground",
              className
            )}
          />
        }
      >
        <CalendarIcon className="size-3.5 opacity-70 shrink-0" />
        <span className="truncate flex-1">
          {selectedDate ? format(selectedDate, "PPP") : placeholder}
        </span>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 z-[100]" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleSelect}
        />
      </PopoverContent>
    </Popover>
  );
}

export default DatePicker;
