import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface StoreHour {
  id: string;
  day_of_week: number;
  open_time: string;
  close_time: string;
}

interface StoreStatus {
  isOpen: boolean;
  currentDayHours: StoreHour[];
  allHours: StoreHour[];
  nextOpenTime: string | null;
  forceStatus: "normal" | "force_open" | "force_closed" | null;
}

export function useStoreStatus(storeId: string | undefined, forceStatus: "normal" | "force_open" | "force_closed" | null) {
  const [status, setStatus] = useState<StoreStatus>({
    isOpen: false,
    currentDayHours: [],
    allHours: [],
    nextOpenTime: null,
    forceStatus: forceStatus,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!storeId) {
      setLoading(false);
      return;
    }

    loadStoreHours();
    // Update every minute
    const interval = setInterval(loadStoreHours, 60000);
    return () => clearInterval(interval);
  }, [storeId, forceStatus]);

  const loadStoreHours = async () => {
    if (!storeId) return;

    try {
      const { data: hours, error } = await supabase
        .from("store_hours")
        .select("*")
        .eq("store_id", storeId)
        .order("day_of_week", { ascending: true })
        .order("open_time", { ascending: true });

      if (error) throw error;

      const now = new Date();
      const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const currentTime = now.toTimeString().slice(0, 5); // HH:mm format

      // Check force status first
      if (forceStatus === "force_open") {
        setStatus({
          isOpen: true,
          currentDayHours: hours?.filter((h) => h.day_of_week === currentDay) || [],
          allHours: hours || [],
          nextOpenTime: null,
          forceStatus,
        });
        setLoading(false);
        return;
      }

      if (forceStatus === "force_closed") {
        setStatus({
          isOpen: false,
          currentDayHours: hours?.filter((h) => h.day_of_week === currentDay) || [],
          allHours: hours || [],
          nextOpenTime: null,
          forceStatus,
        });
        setLoading(false);
        return;
      }

      // Check if currently open based on schedule
      const currentDayHours = hours?.filter((h) => h.day_of_week === currentDay) || [];
      const isCurrentlyOpen = currentDayHours.some(
        (h) => currentTime >= h.open_time.slice(0, 5) && currentTime < h.close_time.slice(0, 5)
      );

      // Find next opening time
      let nextOpenTime: string | null = null;
      if (!isCurrentlyOpen && hours) {
        // Check remaining hours today
        const todayNextOpen = currentDayHours.find((h) => currentTime < h.open_time.slice(0, 5));
        if (todayNextOpen) {
          nextOpenTime = `Hoy ${todayNextOpen.open_time.slice(0, 5)}`;
        } else {
          // Check next days
          const daysToCheck = [1, 2, 3, 4, 5, 6, 0]; // Check all days starting from tomorrow
          const startIndex = daysToCheck.indexOf(currentDay);
          const orderedDays = [...daysToCheck.slice(startIndex + 1), ...daysToCheck.slice(0, startIndex + 1)];
          
          for (const day of orderedDays) {
            const dayHours = hours.filter((h) => h.day_of_week === day);
            if (dayHours.length > 0) {
              const dayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
              nextOpenTime = `${dayNames[day]} ${dayHours[0].open_time.slice(0, 5)}`;
              break;
            }
          }
        }
      }

      setStatus({
        isOpen: isCurrentlyOpen,
        currentDayHours,
        allHours: hours || [],
        nextOpenTime,
        forceStatus,
      });
    } catch (error) {
      console.error("Error loading store hours:", error);
    } finally {
      setLoading(false);
    }
  };

  return { status, loading };
}
