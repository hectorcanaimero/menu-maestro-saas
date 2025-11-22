import { useEffect } from "react";
import { useStore } from "@/contexts/StoreContext";

/**
 * Hook that applies store theme colors as CSS variables
 */
export const useStoreTheme = () => {
  const { store } = useStore();

  useEffect(() => {
    if (!store) return;

    const root = document.documentElement;

    // Convert hex to HSL for CSS variables
    const hexToHSL = (hex: string): string => {
      // Remove # if present
      hex = hex.replace(/^#/, "");

      // Convert to RGB
      const r = parseInt(hex.substring(0, 2), 16) / 255;
      const g = parseInt(hex.substring(2, 4), 16) / 255;
      const b = parseInt(hex.substring(4, 6), 16) / 255;

      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      let h = 0,
        s = 0;
      const l = (max + min) / 2;

      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

        switch (max) {
          case r:
            h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
            break;
          case g:
            h = ((b - r) / d + 2) / 6;
            break;
          case b:
            h = ((r - g) / d + 4) / 6;
            break;
        }
      }

      h = Math.round(h * 360);
      s = Math.round(s * 100);
      const lPercent = Math.round(l * 100);

      return `${h} ${s}% ${lPercent}%`;
    };

    // Apply primary color
    if (store.primary_color) {
      try {
        const hsl = hexToHSL(store.primary_color);
        root.style.setProperty("--primary", hsl);
        
        // Also set a lighter version for hover states
        const parts = hsl.split(" ");
        const h = parts[0];
        const s = parts[1];
        const l = parseInt(parts[2]);
        const lighterL = Math.min(l + 10, 95);
        root.style.setProperty("--primary-hover", `${h} ${s} ${lighterL}%`);
      } catch (error) {
        console.error("Error converting primary color:", error);
      }
    }

    // Apply price color
    if (store.price_color) {
      try {
        const hsl = hexToHSL(store.price_color);
        root.style.setProperty("--price-color", hsl);
      } catch (error) {
        console.error("Error converting price color:", error);
      }
    }

    // Cleanup function to reset colors when unmounting
    return () => {
      if (store.primary_color) {
        root.style.removeProperty("--primary");
        root.style.removeProperty("--primary-hover");
      }
      if (store.price_color) {
        root.style.removeProperty("--price-color");
      }
    };
  }, [store]);
};
