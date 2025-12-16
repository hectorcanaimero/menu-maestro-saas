import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStore } from "@/contexts/StoreContext";
import { useMemo } from "react";

/**
 * Calculate relative luminance of a color
 * Used for determining contrast ratios
 */
const getLuminance = (r: number, g: number, b: number): number => {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const val = c / 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
};

/**
 * Get contrasting text color (white or black) based on background color
 */
const getContrastColor = (hexColor: string): string => {
  // Remove # if present
  const hex = hexColor.replace(/^#/, "");

  // Convert to RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Calculate luminance
  const luminance = getLuminance(r, g, b);

  // Return white for dark backgrounds, black for light backgrounds
  // Using WCAG threshold of 0.5
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
};

/**
 * Floating WhatsApp button for catalog mode
 * Shows when catalog_mode is enabled, allowing customers to contact via WhatsApp
 */
export const FloatingWhatsAppButton = () => {
  const { store } = useStore();

  // Check if catalog mode is enabled
  const isCatalogMode = (store as any)?.catalog_mode ?? false;

  // Calculate contrasting text color based on primary color
  const textColor = useMemo(() => {
    if (!store?.primary_color) return '#FFFFFF'; // Default white
    return getContrastColor(store.primary_color);
  }, [store?.primary_color]);

  // Only show in catalog mode
  if (!isCatalogMode) {
    return null;
  }

  // WhatsApp phone number (remove + and spaces)
  const whatsappNumber = store?.phone?.replace(/\+/g, '').replace(/\s/g, '') || '';

  const handleWhatsAppClick = () => {
    const message = encodeURIComponent(
      `Hola ${store?.name || 'Tienda'}, estoy interesado en sus productos. ¿Podrían darme más información?`
    );
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <Button
        onClick={handleWhatsAppClick}
        size="lg"
        className="rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 h-16 w-16 p-0"
        style={{
          backgroundColor: store?.primary_color ? store.primary_color : '#25D366', // WhatsApp green default
          color: textColor,
        }}
        aria-label="Contactar por WhatsApp"
      >
        <MessageCircle className="w-8 h-8" />
      </Button>
    </div>
  );
};
