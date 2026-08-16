"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { Category } from "@/types/category";
import { getCategories, createCategoryApi } from "@/lib/api/category";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tag, Plus, FolderKanban, ChevronRight, X, Loader2, Check } from "lucide-react";

import { AddCategoryForm } from "@/components/forms/add-category-form";

export interface NavCategoryProps extends React.ComponentPropsWithoutRef<typeof SidebarGroup> {
  categories?: Category[];
  activeCategoryId?: string;
  onSelectCategory?: (category: Category) => void;
  onCategoryCreated?: (category: Category) => void;
}

export function NavCategory({
  categories: initialCategories,
  activeCategoryId,
  onSelectCategory,
  onCategoryCreated,
  className,
  ...props
}: NavCategoryProps) {
  const [categories, setCategories] = useState<Category[]>(initialCategories || []);
  const [loading, setLoading] = useState(!initialCategories);
  const [error, setError] = useState<string | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

  useEffect(() => {
    if (initialCategories) {
      setCategories(initialCategories);
      setLoading(false);
      return;
    }

    async function fetchUserCategories() {
      try {
        setLoading(true);
        const res = await getCategories();
        if (res.success && Array.isArray(res.data)) {
          setCategories(res.data);
        }
      } catch (err) {
        console.error("Failed to load categories:", err);
        setError(err instanceof Error ? err.message : "Failed to load categories");
      } finally {
        setLoading(false);
      }
    }

    fetchUserCategories();
  }, [initialCategories]);

  const handleCategoryCreated = (newCategory: Category) => {
    setCategories((prev) => [...prev, newCategory]);
    if (onCategoryCreated) {
      onCategoryCreated(newCategory);
    }
  };

  return (
    <>
      <Collapsible defaultOpen className="group/collapsible w-full">
        <SidebarGroup className={className} {...props}>
          <SidebarGroupLabel className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground/75 px-2 mb-1">
            <CollapsibleTrigger className="flex items-center gap-1.5 flex-1 cursor-pointer select-none text-left py-1 hover:text-foreground transition-colors">
              <ChevronRight className="size-3.5 shrink-0 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 text-muted-foreground/60" />
              <FolderKanban className="size-3.5 shrink-0 text-muted-foreground" />
              <span>Categories</span>
            </CollapsibleTrigger>

            <button
              type="button"
              title="Add Category"
              onClick={(e) => {
                e.stopPropagation();
                setIsAddOpen(true);
              }}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors"
            >
              <Plus className="size-3.5" />
              <span className="sr-only">Add Category</span>
            </button>
          </SidebarGroupLabel>

          <CollapsibleContent>
            <SidebarGroupContent className="mt-0.5">
              {loading ? (
                <div className="space-y-1.5 px-2 py-1">
                  <Skeleton className="h-6 w-full rounded-md" />
                  <Skeleton className="h-6 w-3/4 rounded-md" />
                </div>
              ) : error ? (
                <div className="px-2 py-1 text-xs text-destructive">
                  Failed to load categories
                </div>
              ) : categories.length === 0 ? (
                <div className="px-2.5 py-2 text-xs text-muted-foreground italic flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[11px]">
                    <Tag className="size-3 opacity-60" />
                    No categories yet
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsAddOpen(true)}
                    className="text-primary font-medium hover:underline not-italic text-[11px]"
                  >
                    + Create
                  </button>
                </div>
              ) : (
                <SidebarMenu className="space-y-0.5">
                  {categories.map((category) => {
                    const isActive = activeCategoryId === category.id;
                    return (
                      <SidebarMenuItem key={category.id}>
                        <SidebarMenuButton
                          size="sm"
                          isActive={isActive}
                          onClick={() => onSelectCategory?.(category)}
                          className="group/cat flex items-center justify-between rounded-lg h-7.5 px-2 text-xs font-medium transition-colors hover:bg-sidebar-accent"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className="size-2 rounded-full shrink-0 shadow-2xs"
                              style={{ backgroundColor: category.color || "#3b82f6" }}
                            />
                            <span className="truncate text-xs font-medium">
                              {category.name}
                            </span>
                          </div>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              )}
            </SidebarGroupContent>
          </CollapsibleContent>
        </SidebarGroup>
      </Collapsible>

      <AddCategoryForm
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onCategoryCreated={handleCategoryCreated}
      />
    </>
  );
}

export default NavCategory;
