"use client";

import * as React from "react";
import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";
import { Schedule } from "@/types/schedule";
import { Category } from "@/types/category";
import { useSchedule } from "@/providers/schedule-provider";
import { deleteScheduleApi } from "@/lib/api/schedule";
import { deleteCategoryApi } from "@/lib/api/category";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EditScheduleModal } from "./edit-schedule-modal";
import { EditCategoryModal } from "./edit-category-modal";
import { AddScheduleModal } from "./add-schedule-modal";
import { AddCategoryForm } from "./add-category-form";
import {
  X,
  Search,
  Plus,
  Repeat,
  Tag,
  Pencil,
  Trash2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Layers,
  Calendar,
  ListTodo,
} from "lucide-react";

export interface ManageSchedulesCategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: "schedules" | "categories";
}

export function ManageSchedulesCategoriesModal({
  isOpen,
  onClose,
  defaultTab = "schedules",
}: ManageSchedulesCategoriesModalProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    schedules,
    categories,
    scheduleItems,
    calendarItems,
    removeSchedule,
    removeCategory,
    addSchedule,
    addCategory,
  } = useSchedule();

  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"schedules" | "categories">(defaultTab);
  const [searchQuery, setSearchQuery] = useState("");

  // Sub-modal states
  const [isAddScheduleOpen, setIsAddScheduleOpen] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "schedule" | "category";
    id: string;
    title: string;
    subCount?: number;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab);
      setSearchQuery("");
      setDeleteTarget(null);
      setDeleteError(null);
    }
  }, [isOpen, defaultTab]);

  // Filtered schedules
  const filteredSchedules = useMemo(() => {
    if (!searchQuery.trim()) return schedules;
    const q = searchQuery.toLowerCase();
    return schedules.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        (s.description && s.description.toLowerCase().includes(q))
    );
  }, [schedules, searchQuery]);

  // Filtered categories
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    const q = searchQuery.toLowerCase();
    return categories.filter((c) => c.name.toLowerCase().includes(q));
  }, [categories, searchQuery]);

  // Helper to get routine items for a schedule
  const getRoutineItemsForSchedule = (scheduleId: string) => {
    return scheduleItems.filter((item) => item.schedule_id === scheduleId);
  };

  // Helper to get category usages
  const getCategoryUsage = (categoryId: string) => {
    const calCount = calendarItems.filter((c) => c.category_id === categoryId).length;
    const schedCount = scheduleItems.filter((s) => s.category_id === categoryId).length;
    return { calCount, schedCount, total: calCount + schedCount };
  };

  if (!isOpen || !mounted) return null;

  // Handle Delete Confirmation
  const promptDeleteSchedule = (schedule: Schedule) => {
    const count = getRoutineItemsForSchedule(schedule.id).length;
    setDeleteError(null);
    setDeleteTarget({
      type: "schedule",
      id: schedule.id,
      title: schedule.title,
      subCount: count,
    });
  };

  const promptDeleteCategory = (category: Category) => {
    const { total } = getCategoryUsage(category.id);
    setDeleteError(null);
    setDeleteTarget({
      type: "category",
      id: category.id,
      title: category.name,
      subCount: total,
    });
  };

  const handleExecuteDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setDeleteError(null);

    try {
      if (deleteTarget.type === "schedule") {
        const res = await deleteScheduleApi(deleteTarget.id);
        if (res.success) {
          removeSchedule(deleteTarget.id);
          // If the deleted schedule is active in search params, remove it
          if (searchParams.get("scheduleId") === deleteTarget.id) {
            const params = new URLSearchParams(searchParams.toString());
            params.delete("scheduleId");
            router.push(`/dashboard?${params.toString()}`);
          }
          setDeleteTarget(null);
        } else {
          setDeleteError(res.error || "Failed to delete schedule.");
        }
      } else {
        const res = await deleteCategoryApi(deleteTarget.id);
        if (res.success) {
          removeCategory(deleteTarget.id);
          // If the deleted category is active in search params, remove it
          if (searchParams.get("categoryId") === deleteTarget.id) {
            const params = new URLSearchParams(searchParams.toString());
            params.delete("categoryId");
            router.push(`/dashboard?${params.toString()}`);
          }
          setDeleteTarget(null);
        } else {
          setDeleteError(res.error || "Failed to delete category.");
        }
      }
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete item.");
    } finally {
      setIsDeleting(false);
    }
  };

  return createPortal(
    <>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="manage_modal_title"
        className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      >
        {/* Backdrop */}
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/55 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
        />

        {/* Main Dialog Box */}
        <div className="relative w-full max-w-3xl rounded-xl border border-border bg-card text-card-foreground shadow-2xl z-10 max-h-[88vh] flex flex-col animate-in fade-in zoom-in-98 duration-150 overflow-hidden">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between shrink-0 bg-card">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Layers className="size-4" />
              </div>
              <div>
                <h3 id="manage_modal_title" className="text-base font-semibold text-foreground">
                  Manage Schedules & Categories
                </h3>
                <p className="text-xs text-muted-foreground">
                  View full details, edit properties, or delete schedules and categories.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              className="p-1.5 rounded-md text-muted-foreground/70 hover:text-foreground hover:bg-muted/70 transition-colors cursor-pointer"
            >
              <X className="size-4.5" />
            </button>
          </div>

          {/* Controls Bar: Tabs, Search, Add Button */}
          <div className="p-4 border-b border-border/60 bg-muted/20 space-y-3 shrink-0">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              {/* Segmented Tab Buttons */}
              <div className="inline-flex items-center p-1 rounded-lg bg-muted border border-border text-xs font-medium self-start">
                <button
                  type="button"
                  onClick={() => setActiveTab("schedules")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                    activeTab === "schedules"
                      ? "bg-card text-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Repeat className="size-3.5" />
                  <span>Schedules</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-primary/10 text-primary font-bold">
                    {schedules.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("categories")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                    activeTab === "categories"
                      ? "bg-card text-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Tag className="size-3.5" />
                  <span>Categories</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-primary/10 text-primary font-bold">
                    {categories.length}
                  </span>
                </button>
              </div>

              {/* Action Button */}
              {activeTab === "schedules" ? (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setIsAddScheduleOpen(true)}
                  className="h-8 gap-1.5 text-xs font-medium cursor-pointer shadow-xs"
                >
                  <Plus className="size-3.5" />
                  <span>New Schedule</span>
                </Button>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setIsAddCategoryOpen(true)}
                  className="h-8 gap-1.5 text-xs font-medium cursor-pointer shadow-xs"
                >
                  <Plus className="size-3.5" />
                  <span>New Category</span>
                </Button>
              )}
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
              <Input
                type="text"
                placeholder={
                  activeTab === "schedules"
                    ? "Search schedules by title or description..."
                    : "Search categories by name..."
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-xs bg-card"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* List Content Container */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
            {activeTab === "schedules" ? (
              /* SCHEDULES LIST */
              filteredSchedules.length === 0 ? (
                <div className="p-8 text-center rounded-xl border border-dashed border-border bg-card/50 flex flex-col items-center justify-center space-y-2">
                  <div className="size-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                    <Repeat className="size-5" />
                  </div>
                  <h4 className="text-sm font-medium text-foreground">
                    {searchQuery ? "No matching schedules found" : "No schedules created yet"}
                  </h4>
                  <p className="text-xs text-muted-foreground max-w-sm">
                    {searchQuery
                      ? "Try searching with a different keyword or clear the search filter."
                      : "Create your first schedule to start planning routines and timelines."}
                  </p>
                  {!searchQuery && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setIsAddScheduleOpen(true)}
                      className="mt-2 text-xs font-medium cursor-pointer"
                    >
                      <Plus className="mr-1.5 size-3.5" />
                      Create Schedule
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {filteredSchedules.map((schedule) => {
                    const items = getRoutineItemsForSchedule(schedule.id);
                    const isPlanned = Boolean(schedule.start_date && schedule.end_date);

                    return (
                      <div
                        key={schedule.id}
                        className="rounded-xl border border-border bg-card text-card-foreground p-4 shadow-2xs hover:border-border/80 transition-all space-y-3 text-left"
                      >
                        {/* Top Card Row: [name/title] [edit] [delete] */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2.5 min-w-0">
                            <div className="size-8.5 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                              <Repeat className="size-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-sm font-semibold text-foreground tracking-tight truncate">
                                  {schedule.title}
                                </h4>
                                {isPlanned ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                                    <CheckCircle2 className="size-3" />
                                    Planned Schedule
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                    Ongoing Schedule
                                  </span>
                                )}
                              </div>
                              {schedule.description ? (
                                <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                                  {schedule.description}
                                </p>
                              ) : (
                                <p className="text-[11px] text-muted-foreground/60 italic mt-0.5">
                                  No description provided
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Action Buttons: [edit] [delete] */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingSchedule(schedule)}
                              className="h-7.5 px-2.5 text-xs gap-1.5 cursor-pointer hover:bg-muted font-medium rounded-md"
                            >
                              <Pencil className="size-3.5 text-muted-foreground" />
                              <span>Edit</span>
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => promptDeleteSchedule(schedule)}
                              className="h-7.5 px-2.5 text-xs gap-1.5 cursor-pointer text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/25 font-medium rounded-md"
                            >
                              <Trash2 className="size-3.5" />
                              <span>Delete</span>
                            </Button>
                          </div>
                        </div>

                        {/* Full Details Section */}
                        <div className="pt-2.5 border-t border-border/60 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                          {/* Duration / Schedule timeline */}
                          <div className="flex items-start gap-2 bg-muted/30 p-2.5 rounded-lg border border-border/40">
                            <Clock className="size-3.5 text-primary shrink-0 mt-0.5" />
                            <div className="space-y-0.5 min-w-0">
                              <span className="text-[11px] font-medium text-muted-foreground block">
                                Duration / Timeline
                              </span>
                              {isPlanned ? (
                                <span className="font-semibold text-foreground text-xs block">
                                  {schedule.start_date} → {schedule.end_date}
                                </span>
                              ) : (
                                <span className="font-semibold text-foreground text-xs block">
                                  {schedule.start_date
                                    ? `Starts ${schedule.start_date} (Indefinite)`
                                    : "Indefinite weekly routine"}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Routine Items Info */}
                          <div className="flex items-start gap-2 bg-muted/30 p-2.5 rounded-lg border border-border/40">
                            <ListTodo className="size-3.5 text-primary shrink-0 mt-0.5" />
                            <div className="space-y-0.5 min-w-0">
                              <span className="text-[11px] font-medium text-muted-foreground block">
                                Routine Tasks ({items.length})
                              </span>
                              <span className="font-semibold text-foreground text-xs block">
                                {items.length === 0
                                  ? "No routine tasks configured"
                                  : `${items.length} routine task${items.length > 1 ? "s" : ""} scheduled`}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Routine Item Badges (if any) */}
                        {items.length > 0 && (
                          <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                            {items.map((it) => (
                              <span
                                key={it.id}
                                className="inline-flex items-center gap-1 text-[10px] font-medium bg-muted text-foreground/80 px-2 py-0.5 rounded-md border border-border/50"
                              >
                                <span className="font-semibold">{it.title}</span>
                                <span className="text-muted-foreground">
                                  ({it.days.join(",")}) {it.start_time}-{it.end_time}
                                </span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )
            ) : (
              /* CATEGORIES LIST */
              filteredCategories.length === 0 ? (
                <div className="p-8 text-center rounded-xl border border-dashed border-border bg-card/50 flex flex-col items-center justify-center space-y-2">
                  <div className="size-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                    <Tag className="size-5" />
                  </div>
                  <h4 className="text-sm font-medium text-foreground">
                    {searchQuery ? "No matching categories found" : "No categories created yet"}
                  </h4>
                  <p className="text-xs text-muted-foreground max-w-sm">
                    {searchQuery
                      ? "Try searching with a different category name."
                      : "Create categories to color-code and organize your routines and calendar events."}
                  </p>
                  {!searchQuery && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setIsAddCategoryOpen(true)}
                      className="mt-2 text-xs font-medium cursor-pointer"
                    >
                      <Plus className="mr-1.5 size-3.5" />
                      Create Category
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredCategories.map((category) => {
                    const usage = getCategoryUsage(category.id);

                    return (
                      <div
                        key={category.id}
                        className="rounded-xl border border-border bg-card text-card-foreground p-4 shadow-2xs hover:border-border/80 transition-all space-y-3 text-left"
                      >
                        {/* Top Card Row: [name/title] [edit] [delete] */}
                        <div className="flex items-start justify-between gap-2.5">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className="size-8.5 rounded-lg flex items-center justify-center shrink-0 shadow-2xs"
                              style={{
                                backgroundColor: `${category.color || "#64748b"}20`,
                                color: category.color || "#64748b",
                              }}
                            >
                              <Tag className="size-4" />
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-sm font-semibold text-foreground tracking-tight truncate flex items-center gap-2">
                                <span>{category.name}</span>
                                <span
                                  className="size-2 rounded-full shrink-0 ring-1 ring-border"
                                  style={{ backgroundColor: category.color || "#64748b" }}
                                />
                              </h4>
                              <span className="text-[11px] font-mono text-muted-foreground">
                                {category.color || "#64748b"}
                              </span>
                            </div>
                          </div>

                          {/* Action Buttons: [edit] [delete] */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingCategory(category)}
                              className="h-7.5 px-2.5 text-xs gap-1.5 cursor-pointer hover:bg-muted font-medium rounded-md"
                            >
                              <Pencil className="size-3.5 text-muted-foreground" />
                              <span>Edit</span>
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => promptDeleteCategory(category)}
                              className="h-7.5 px-2.5 text-xs gap-1.5 cursor-pointer text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/25 font-medium rounded-md"
                            >
                              <Trash2 className="size-3.5" />
                              <span>Delete</span>
                            </Button>
                          </div>
                        </div>

                        {/* Full Details Section */}
                        <div className="pt-2.5 border-t border-border/60 grid grid-cols-2 gap-2 text-xs">
                          {/* Calendar Events Usage */}
                          <div className="bg-muted/30 p-2 rounded-lg border border-border/40 space-y-0.5">
                            <span className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
                              <Calendar className="size-3 text-muted-foreground" />
                              Events
                            </span>
                            <span className="font-semibold text-foreground text-xs block">
                              {usage.calCount} event{usage.calCount === 1 ? "" : "s"}
                            </span>
                          </div>

                          {/* Schedule Routines Usage */}
                          <div className="bg-muted/30 p-2 rounded-lg border border-border/40 space-y-0.5">
                            <span className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
                              <Repeat className="size-3 text-muted-foreground" />
                              Routines
                            </span>
                            <span className="font-semibold text-foreground text-xs block">
                              {usage.schedCount} routine{usage.schedCount === 1 ? "" : "s"}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            )}
          </div>

          {/* Footer */}
          <div className="p-3.5 sm:p-4 border-t border-border bg-card flex items-center justify-between shrink-0">
            <div className="text-xs text-muted-foreground">
              Total: {activeTab === "schedules" ? `${schedules.length} schedules` : `${categories.length} categories`}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs font-medium cursor-pointer"
            >
              Close
            </Button>
          </div>
        </div>
      </div>

      {/* DELETE CONFIRMATION DIALOG */}
      {deleteTarget && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete_confirm_title"
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 overflow-y-auto"
        >
          <div
            onClick={() => !isDeleting && setDeleteTarget(null)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
          />

          <div className="relative w-full max-w-md rounded-xl border border-border bg-card text-card-foreground p-5 shadow-xl z-10 animate-in fade-in zoom-in-98 duration-150 space-y-3.5 text-left">
            <div className="flex items-center gap-2.5">
              <div className="size-9 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
                <AlertTriangle className="size-5" />
              </div>
              <div>
                <h3 id="delete_confirm_title" className="text-sm font-semibold text-foreground">
                  Delete {deleteTarget.type === "schedule" ? "Schedule" : "Category"}?
                </h3>
                <p className="text-xs text-muted-foreground">
                  This action cannot be undone.
                </p>
              </div>
            </div>

            {deleteError && (
              <div role="alert" className="p-2.5 text-xs font-medium bg-destructive/10 text-destructive border border-destructive/20 rounded-md">
                {deleteError}
              </div>
            )}

            <div className="text-xs text-muted-foreground leading-relaxed">
              {deleteTarget.type === "schedule" ? (
                <>
                  Are you sure you want to delete <strong className="text-foreground font-semibold">&quot;{deleteTarget.title}&quot;</strong>?
                  {deleteTarget.subCount && deleteTarget.subCount > 0 ? (
                    <span className="block mt-1 text-destructive font-medium">
                      ⚠️ This will also delete {deleteTarget.subCount} associated routine task(s).
                    </span>
                  ) : null}
                </>
              ) : (
                <>
                  Are you sure you want to delete category <strong className="text-foreground font-semibold">&quot;{deleteTarget.title}&quot;</strong>?
                  {deleteTarget.subCount && deleteTarget.subCount > 0 ? (
                    <span className="block mt-1 text-foreground/80">
                      Items currently assigned to this category will have their category cleared.
                    </span>
                  ) : null}
                </>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border mt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="rounded-md font-medium cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleExecuteDelete}
                disabled={isDeleting}
                className="rounded-md font-medium cursor-pointer"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Confirm Delete"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* SUB-MODALS: Add Schedule */}
      <AddScheduleModal
        isOpen={isAddScheduleOpen}
        onClose={() => setIsAddScheduleOpen(false)}
        onScheduleCreated={(newSched) => {
          addSchedule(newSched);
          setIsAddScheduleOpen(false);
        }}
      />

      {/* SUB-MODALS: Add Category */}
      <AddCategoryForm
        isOpen={isAddCategoryOpen}
        onClose={() => setIsAddCategoryOpen(false)}
        onCategoryCreated={(newCat) => {
          addCategory(newCat);
          setIsAddCategoryOpen(false);
        }}
      />

      {/* SUB-MODALS: Edit Schedule */}
      <EditScheduleModal
        isOpen={Boolean(editingSchedule)}
        schedule={editingSchedule}
        onClose={() => setEditingSchedule(null)}
      />

      {/* SUB-MODALS: Edit Category */}
      <EditCategoryModal
        isOpen={Boolean(editingCategory)}
        category={editingCategory}
        onClose={() => setEditingCategory(null)}
      />
    </>,
    document.body
  );
}

export default ManageSchedulesCategoriesModal;
