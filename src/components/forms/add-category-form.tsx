"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Category } from "@/types/category";
import { createCategoryApi } from "@/lib/api/category";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Loader2, Tag, Check } from "lucide-react";

export interface AddCategoryFormProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoryCreated: (cat: Category) => void;
}

const PRESET_COLORS = [
  "#64748b", // Slate
  "#3b82f6", // Blue
  "#06b6d4", // Cyan
  "#10b981", // Emerald
  "#84cc16", // Lime
  "#f59e0b", // Amber
  "#ef4444", // Red
  "#ec4899", // Pink
  "#8b5cf6", // Purple
];

export function AddCategoryForm({
  isOpen,
  onClose,
  onCategoryCreated,
}: AddCategoryFormProps) {
  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError("Category name is required.");
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const res = await createCategoryApi({
        name: name.trim(),
        color,
      });

      if (res.success && res.data) {
        const newCat = Array.isArray(res.data) ? res.data[0] : res.data;
        onCategoryCreated(newCat);
        setName("");
        setColor(PRESET_COLORS[0]);
        onClose();
      } else {
        setFormError(res.error || "Failed to create category.");
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to create category.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="add_cat_modal_title"
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

        <div className="flex items-center gap-2.5">
          <div className="size-7 rounded-md bg-muted text-foreground flex items-center justify-center">
            <Tag className="size-3.5" />
          </div>
          <div>
            <h3 id="add_cat_modal_title" className="text-sm font-semibold text-foreground">
              New Category
            </h3>
            <p className="text-xs text-muted-foreground">
              Tag routines and events with custom colors.
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
            <label htmlFor="cat_name_input" className="text-xs font-medium text-foreground">
              Category Name
            </label>
            <Input
              id="cat_name_input"
              type="text"
              placeholder="e.g. Work, Fitness, Study"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
              className="h-8 rounded-md"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Color</label>
            <div
              role="radiogroup"
              aria-label="Select category color"
              className="flex items-center gap-2 flex-wrap"
            >
              {PRESET_COLORS.map((c) => {
                const isSelected = color === c;
                return (
                  <button
                    key={c}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    aria-label={`Select color ${c}`}
                    onClick={() => setColor(c)}
                    className="relative size-6 rounded-full transition-transform cursor-pointer flex items-center justify-center hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    style={{
                      backgroundColor: c,
                      boxShadow: isSelected ? `0 0 0 2px var(--background), 0 0 0 3.5px ${c}` : undefined,
                    }}
                  >
                    {isSelected && <Check className="size-3 text-white drop-shadow-sm" />}
                  </button>
                );
              })}
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
                "Create Category"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

export default AddCategoryForm;
