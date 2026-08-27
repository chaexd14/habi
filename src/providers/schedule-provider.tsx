"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { Schedule, ScheduleItem } from "@/types/schedule";
import { Category } from "@/types/category";
import { CalendarItem } from "@/types/calendar-item";
import { getSchedules, clearScheduleCache } from "@/lib/api/schedule";
import { getCategories, clearCategoryCache } from "@/lib/api/category";
import { getCalendarItems, clearCalendarItemCache } from "@/lib/api/calendar-item";
import { getScheduleItems, clearScheduleItemCache } from "@/lib/api/schedule-item";
import { useProfile } from "@/providers/profile-provider";

interface ScheduleContextType {
  schedules: Schedule[];
  categories: Category[];
  calendarItems: CalendarItem[];
  scheduleItems: ScheduleItem[];
  loading: boolean;
  error: string | null;
  refetchAll: (forceRefresh?: boolean) => Promise<void>;
  refetchSchedules: (forceRefresh?: boolean) => Promise<void>;
  refetchCategories: (forceRefresh?: boolean) => Promise<void>;
  refetchCalendarItems: (forceRefresh?: boolean) => Promise<void>;
  refetchScheduleItems: (forceRefresh?: boolean) => Promise<void>;
  addSchedule: (schedule: Schedule) => void;
  updateSchedule: (schedule: Schedule) => void;
  removeSchedule: (id: string) => void;
  addCategory: (category: Category) => void;
  updateCategory: (category: Category) => void;
  removeCategory: (id: string) => void;
  addCalendarItem: (item: CalendarItem) => void;
  updateCalendarItem: (item: CalendarItem) => void;
  removeCalendarItem: (id: string) => void;
  addScheduleItem: (item: ScheduleItem) => void;
  updateScheduleItem: (item: ScheduleItem) => void;
  removeScheduleItem: (id: string) => void;
}

const ScheduleContext = createContext<ScheduleContextType>({
  schedules: [],
  categories: [],
  calendarItems: [],
  scheduleItems: [],
  loading: true,
  error: null,
  refetchAll: async () => {},
  refetchSchedules: async () => {},
  refetchCategories: async () => {},
  refetchCalendarItems: async () => {},
  refetchScheduleItems: async () => {},
  addSchedule: () => {},
  updateSchedule: () => {},
  removeSchedule: () => {},
  addCategory: () => {},
  updateCategory: () => {},
  removeCategory: () => {},
  addCalendarItem: () => {},
  updateCalendarItem: () => {},
  removeCalendarItem: () => {},
  addScheduleItem: () => {},
  updateScheduleItem: () => {},
  removeScheduleItem: () => {},
});

export function ScheduleProvider({ children }: { children: React.ReactNode }) {
  const { userProfile } = useProfile();

  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [calendarItems, setCalendarItems] = useState<CalendarItem[]>([]);
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isInitialFetchDone = useRef(false);

  const refetchSchedules = useCallback(async (forceRefresh = true) => {
    try {
      if (forceRefresh) clearScheduleCache();
      const res = await getSchedules(forceRefresh);
      if (res.success && Array.isArray(res.data)) {
        setSchedules(res.data);
      }
    } catch (err) {
      console.error("Error fetching schedules:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch schedules");
    }
  }, []);

  const refetchCategories = useCallback(async (forceRefresh = true) => {
    try {
      if (forceRefresh) clearCategoryCache();
      const res = await getCategories(forceRefresh);
      if (res.success && Array.isArray(res.data)) {
        setCategories(res.data);
      }
    } catch (err) {
      console.error("Error fetching categories:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch categories");
    }
  }, []);

  const refetchCalendarItems = useCallback(async (forceRefresh = true) => {
    try {
      if (forceRefresh) clearCalendarItemCache();
      const res = await getCalendarItems(forceRefresh);
      if (res.success && Array.isArray(res.data)) {
        setCalendarItems(res.data);
      }
    } catch (err) {
      console.error("Error fetching calendar items:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch calendar items");
    }
  }, []);

  const refetchScheduleItems = useCallback(async (forceRefresh = true) => {
    try {
      if (forceRefresh) clearScheduleItemCache();
      const res = await getScheduleItems(forceRefresh);
      if (res.success && Array.isArray(res.data)) {
        setScheduleItems(res.data);
      }
    } catch (err) {
      console.error("Error fetching schedule items:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch schedule items");
    }
  }, []);

  const refetchAll = useCallback(
    async (forceRefresh = true) => {
      setLoading(true);
      setError(null);
      try {
        if (forceRefresh) {
          clearScheduleCache();
          clearCategoryCache();
          clearCalendarItemCache();
          clearScheduleItemCache();
        }

        const [schedRes, catRes, calRes, schedItemsRes] = await Promise.all([
          getSchedules(forceRefresh),
          getCategories(forceRefresh),
          getCalendarItems(forceRefresh),
          getScheduleItems(forceRefresh),
        ]);

        if (schedRes.success && Array.isArray(schedRes.data)) {
          setSchedules(schedRes.data);
        }
        if (catRes.success && Array.isArray(catRes.data)) {
          setCategories(catRes.data);
        }
        if (calRes.success && Array.isArray(calRes.data)) {
          setCalendarItems(calRes.data);
        }
        if (schedItemsRes.success && Array.isArray(schedItemsRes.data)) {
          setScheduleItems(schedItemsRes.data);
        }
      } catch (err) {
        console.error("Failed to load planner data:", err);
        setError(err instanceof Error ? err.message : "Failed to load planner data");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Initial load when user profile is ready
  useEffect(() => {
    if (userProfile?.id && !isInitialFetchDone.current) {
      isInitialFetchDone.current = true;
      refetchAll(true);
    }
  }, [userProfile?.id, refetchAll]);

  // Listen to cross-window or internal invalidation events
  useEffect(() => {
    const handleInvalidation = (event: Event) => {
      const customEvent = event as CustomEvent<{ type?: string }>;
      const type = customEvent.detail?.type;

      if (!type || type === "all") {
        refetchAll(true);
      } else if (type === "schedules") {
        refetchSchedules(true);
      } else if (type === "categories") {
        refetchCategories(true);
      } else if (type === "calendar-items") {
        refetchCalendarItems(true);
      } else if (type === "schedule-items") {
        refetchScheduleItems(true);
      }
    };

    window.addEventListener("habi:data-invalidated", handleInvalidation);
    return () => {
      window.removeEventListener("habi:data-invalidated", handleInvalidation);
    };
  }, [refetchAll, refetchSchedules, refetchCategories, refetchCalendarItems, refetchScheduleItems]);

  // Synchronous / Optimistic state modifiers
  const addSchedule = useCallback((newSched: Schedule) => {
    setSchedules((prev) => {
      if (prev.some((s) => s.id === newSched.id)) {
        return prev.map((s) => (s.id === newSched.id ? newSched : s));
      }
      return [...prev, newSched];
    });
  }, []);

  const updateSchedule = useCallback((updatedSched: Schedule) => {
    setSchedules((prev) => prev.map((s) => (s.id === updatedSched.id ? updatedSched : s)));
  }, []);

  const removeSchedule = useCallback((id: string) => {
    setSchedules((prev) => prev.filter((s) => s.id !== id));
    setScheduleItems((prev) => prev.filter((item) => item.schedule_id !== id));
  }, []);

  const addCategory = useCallback((newCat: Category) => {
    setCategories((prev) => {
      if (prev.some((c) => c.id === newCat.id)) {
        return prev.map((c) => (c.id === newCat.id ? newCat : c));
      }
      return [...prev, newCat];
    });
  }, []);

  const updateCategory = useCallback((updatedCat: Category) => {
    setCategories((prev) => prev.map((c) => (c.id === updatedCat.id ? updatedCat : c)));
  }, []);

  const removeCategory = useCallback((id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const addCalendarItem = useCallback((newItem: CalendarItem) => {
    setCalendarItems((prev) => {
      if (prev.some((i) => i.id === newItem.id)) {
        return prev.map((i) => (i.id === newItem.id ? newItem : i));
      }
      return [...prev, newItem];
    });
  }, []);

  const updateCalendarItem = useCallback((updatedItem: CalendarItem) => {
    setCalendarItems((prev) => prev.map((i) => (i.id === updatedItem.id ? updatedItem : i)));
  }, []);

  const removeCalendarItem = useCallback((id: string) => {
    setCalendarItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const addScheduleItem = useCallback((newItem: ScheduleItem) => {
    setScheduleItems((prev) => {
      if (prev.some((i) => i.id === newItem.id)) {
        return prev.map((i) => (i.id === newItem.id ? newItem : i));
      }
      return [...prev, newItem];
    });
  }, []);

  const updateScheduleItem = useCallback((updatedItem: ScheduleItem) => {
    setScheduleItems((prev) => prev.map((i) => (i.id === updatedItem.id ? updatedItem : i)));
  }, []);

  const removeScheduleItem = useCallback((id: string) => {
    setScheduleItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  return (
    <ScheduleContext.Provider
      value={{
        schedules,
        categories,
        calendarItems,
        scheduleItems,
        loading,
        error,
        refetchAll,
        refetchSchedules,
        refetchCategories,
        refetchCalendarItems,
        refetchScheduleItems,
        addSchedule,
        updateSchedule,
        removeSchedule,
        addCategory,
        updateCategory,
        removeCategory,
        addCalendarItem,
        updateCalendarItem,
        removeCalendarItem,
        addScheduleItem,
        updateScheduleItem,
        removeScheduleItem,
      }}
    >
      {children}
    </ScheduleContext.Provider>
  );
}

export function useSchedule() {
  return useContext(ScheduleContext);
}
