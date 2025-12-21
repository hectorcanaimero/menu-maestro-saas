import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { useNavigate } from 'react-router-dom';
import { useCartTotals } from '@/hooks/useCartTotals';
import { useStore } from '@/contexts/StoreContext';
import { useStoreStatus } from '@/hooks/useStoreStatus';
import { useState, useMemo } from 'react';
import { StoreClosedDialog } from '@/components/catalog/StoreClosedDialog';
import { DualPrice } from '@/components/catalog/DualPrice';
import posthog from 'posthog-js';

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
  const hex = hexColor.replace(/^#/, '');

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
 * Floating cart button that appears at the bottom of the screen
 * Shows quantity and subtotal with customizable brand color
 */
export const FloatingCartButton = () => {
  const { items, totalItems } = useCart();
  const { discountedTotal } = useCartTotals(items);
  const { store } = useStore();
  const navigate = useNavigate();
  const { status: storeStatus } = useStoreStatus(store?.id, store?.force_status || null);
  const [showClosedDialog, setShowClosedDialog] = useState(false);

  // Check if catalog mode is enabled
  const isCatalogMode = (store as any)?.catalog_mode ?? false;

  // Calculate contrasting text color based on primary color
  const textColor = useMemo(() => {
    if (!store?.primary_color) return '#FFFFFF'; // Default white
    return getContrastColor(store.primary_color);
  }, [store?.primary_color]);

  // Don't show if cart is empty OR if catalog mode is enabled
  if (totalItems === 0 || isCatalogMode) {
    return null;
  }

  const handleClick = () => {
    // Track floating cart click
    if (store?.id) {
      try {
        posthog.capture('floating_cart_clicked', {
          store_id: store.id,
          items_count: items.length,
          total_items: totalItems,
          cart_value: discountedTotal,
        });
      } catch (error) {
        console.error('[PostHog] Error tracking floating cart click:', error);
      }
    }

    // Validate store is open
    if (!storeStatus.isOpen) {
      setShowClosedDialog(true);
      return;
    }

    navigate('/checkout');
  };

  return (
    <>
      {/* Floating Button */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-md px-1">
        <Button
          onClick={handleClick}
          size="lg"
          className="w-full shadow-2xl hover:shadow-3xl transition-all duration-300 h-14 text-base font-semibold"
          style={{
            backgroundColor: store?.primary_color ? store.primary_color : undefined,
            color: textColor,
          }}
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              <span className="font-semibold">
                {totalItems} {totalItems === 1 ? 'producto' : 'productos'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {/* <span className="text-sm font-normal opacity-90">Comprar</span> */}
              <div className="h-6 w-px" style={{ backgroundColor: `${textColor}30` }} />
              <span className="font-bold">
                <DualPrice price={discountedTotal} size="sm" conversionTextColor={textColor} />
              </span>
            </div>
          </div>
        </Button>
      </div>

      {/* Store Closed Dialog */}
      <StoreClosedDialog
        open={showClosedDialog}
        onOpenChange={setShowClosedDialog}
        storeName={store?.name}
        nextOpenTime={storeStatus.nextOpenTime}
        onViewHours={() => {
          setShowClosedDialog(false);
        }}
      />
    </>
  );
};
