"use client";

import * as React from "react";
import { useState } from "react";
import { Category } from "@/types/category";
import { createCategoryApi } from "@/lib/api/category";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tag, X, Loader2, Check } from "lucide-react";

export interface AddCategoryFormProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoryCreated: (category: Category) => void;
}

const COLOR_PRESETS = [
  "#ef4444", // Red
  "#f97316", // Orange
  "#f59e0b", // Amber
  "#10b981", // Emerald
  "#06b6d4", // Cyan
  "#3b82f6", // Blue
  "#8b5cf6", // Purple
  "#ec4899", // Pink
];

export function AddCategoryForm({ isOpen, onClose, onCategoryCreated }: AddCategoryFormProps) {
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState(COLOR_PRESETS[5]); // Default Blue
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    setFormError(null);
    setIsSubmitting(true);

    try {
      const res = await createCategoryApi({
        name: newCategoryName.trim(),
        color: newCategoryColor,
      });

      if (res.success && res.data) {
        const createdCat: Category = Array.isArray(res.data) ? res.data[0] : res.data;
        onCategoryCreated(createdCat);
        setNewCategoryName("");
        onClose();
      } else {
        setFormError(res.error || "Failed to create category");
      }
    } catch (err) {
      console.error("Create Category Error:", err);
      setFormError(err instanceof Error ? err.message : "Error creating category");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-sm rounded-2xl border border-border/80 bg-card text-card-foreground p-5 shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-150 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-base text-foreground">
            <Tag className="size-4 text-primary" />
            Add Category
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground/70 hover:text-foreground hover:bg-muted/60 transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {formError && (
          <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-2.5 text-xs text-destructive font-medium">
            {formError}
          </div>
        )}

        <form onSubmit={handleAddCategorySubmit} className="space-y-3.5">
          <div className="space-y-1.5">
            <label htmlFor="cat_name" className="text-xs font-medium text-foreground">
              Category Name
            </label>
            <Input
              id="cat_name"
              type="text"
              placeholder="e.g. Work, Personal, Habits"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Color Tag</label>
            <div className="flex items-center gap-2 flex-wrap pt-0.5">
              {COLOR_PRESETS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setNewCategoryColor(color)}
                  className="size-7 rounded-full transition-transform hover:scale-110 flex items-center justify-center shadow-2xs border border-white/20 cursor-pointer"
                  style={{ backgroundColor: color }}
                >
                  {newCategoryColor === color && (
                    <Check className="size-3.5 text-white drop-shadow-xs" />
                  )}
                </button>
              ))}
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
            <Button type="submit" size="sm" disabled={isSubmitting || !newCategoryName.trim()}>
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
    </div>
  );
}
