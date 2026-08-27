"use client";

import * as React from "react";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Category } from "@/types/category";
import { useSchedule } from "@/providers/schedule-provider";
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
import { Tag, Plus, FolderKanban, ChevronRight } from "lucide-react";

import { AddCategoryForm } from "@/components/forms/add-category-form";

export interface NavCategoryProps extends React.ComponentPropsWithoutRef<typeof SidebarGroup> {
  categories?: Category[];
  activeCategoryId?: string;
  onSelectCategory?: (category: Category) => void;
  onCategoryCreated?: (category: Category) => void;
}

export function NavCategory({
  categories: propCategories,
  activeCategoryId,
  onSelectCategory,
  onCategoryCreated,
  className,
  ...props
}: NavCategoryProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { categories: contextCategories, loading: contextLoading, error: contextError, addCategory } = useSchedule();

  const categories = propCategories || contextCategories;
  const loading = propCategories ? false : contextLoading;
  const error = propCategories ? null : contextError;

  const [isAddOpen, setIsAddOpen] = useState(false);

  const currentCategoryId = searchParams.get("categoryId") || activeCategoryId || "";

  const handleSelectCategory = (category: Category) => {
    if (onSelectCategory) {
      onSelectCategory(category);
    }
    const params = new URLSearchParams(searchParams.toString());

    if (currentCategoryId === category.id) {
      params.delete("categoryId");
    } else {
      params.set("categoryId", category.id);
    }

    router.push(`/dashboard?${params.toString()}`);
  };

  const handleCategoryCreated = (newCategory: Category) => {
    addCategory(newCategory);
    if (onCategoryCreated) {
      onCategoryCreated(newCategory);
    }
  };

  return (
    <>
      <Collapsible defaultOpen className="group/collapsible w-full">
        <SidebarGroup className={className} {...props}>
          <SidebarGroupLabel className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 px-2 mb-0.5">
            <CollapsibleTrigger className="flex items-center gap-1.5 flex-1 cursor-pointer select-none text-left py-1 hover:text-foreground transition-colors">
              <ChevronRight className="size-3 shrink-0 transition-transform duration-150 group-data-[state=open]/collapsible:rotate-90 text-muted-foreground/60" />
              <FolderKanban className="size-3.5 shrink-0 opacity-70" />
              <span>Categories</span>
            </CollapsibleTrigger>

            <button
              type="button"
              title="Add Category"
              onClick={(e) => {
                e.stopPropagation();
                setIsAddOpen(true);
              }}
              className="p-0.5 rounded text-muted-foreground/70 hover:text-foreground hover:bg-sidebar-accent transition-colors cursor-pointer"
            >
              <Plus className="size-3.5" />
              <span className="sr-only">Add Category</span>
            </button>
          </SidebarGroupLabel>

          <CollapsibleContent>
            <SidebarGroupContent className="mt-0.5">
              {loading ? (
                <div className="space-y-1 px-1 py-1">
                  <Skeleton className="h-6.5 w-full rounded-md" />
                  <Skeleton className="h-6.5 w-3/4 rounded-md" />
                </div>
              ) : error ? (
                <div className="px-2 py-1 text-xs text-destructive">
                  Failed to load categories
                </div>
              ) : categories.length === 0 ? (
                <div className="px-2.5 py-2 text-[11px] text-muted-foreground flex items-center justify-between bg-card/40 rounded-md border border-dashed border-border">
                  <span className="flex items-center gap-1.5 opacity-80">
                    <Tag className="size-3 opacity-60" />
                    No categories
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsAddOpen(true)}
                    className="text-foreground font-medium hover:underline text-[11px] cursor-pointer"
                  >
                    + New
                  </button>
                </div>
              ) : (
                <SidebarMenu className="space-y-0.5">
                  {categories.map((category) => {
                    const isActive = currentCategoryId === category.id;
                    return (
                      <SidebarMenuItem key={category.id}>
                        <SidebarMenuButton
                          size="sm"
                          isActive={isActive}
                          onClick={() => handleSelectCategory(category)}
                          className="group/cat flex items-center justify-between rounded-md h-7.5 px-2 text-xs font-medium transition-colors hover:bg-sidebar-accent data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground data-[active=true]:font-semibold"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className="size-1.5 rounded-full shrink-0"
                              style={{ backgroundColor: category.color || "#64748b" }}
                            />
                            <span className="truncate text-xs">
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
