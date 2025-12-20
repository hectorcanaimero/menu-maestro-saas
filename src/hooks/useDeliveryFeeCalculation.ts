import { useMemo } from 'react';

interface DeliveryZone {
  id: string;
  zone_name: string;
  delivery_price: number;
  free_delivery_enabled: boolean;
  free_delivery_min_amount: number | null;
}

interface Store {
  delivery_price_mode: 'fixed' | 'by_zone';
  fixed_delivery_price: number;
  free_delivery_enabled: boolean;
  global_free_delivery_min_amount: number | null;
}

interface DeliveryFeeCalculationResult {
  deliveryFee: number;
  isFreeDelivery: boolean;
  amountNeededForFreeDelivery: number | null;
  freeDeliveryThreshold: number | null;
  canHaveFreeDelivery: boolean;
}

/**
 * Hook to calculate delivery fee based on cart total, selected zone, and free delivery settings
 * 
 * Free delivery logic:
 * 1. If store.free_delivery_enabled is false, never apply free delivery
 * 2. For fixed price mode:
 *    - Use global_free_delivery_min_amount if set
 * 3. For by_zone mode:
 *    - If zone.free_delivery_enabled is false, never apply free delivery
 *    - If zone.free_delivery_min_amount is set, use that value
 *    - Otherwise, use global_free_delivery_min_amount
 */
export const useDeliveryFeeCalculation = (
  store: Store | null,
  selectedZone: DeliveryZone | null,
  cartTotal: number
): DeliveryFeeCalculationResult => {
  return useMemo(() => {
    // Default result when store is not loaded
    if (!store) {
      return {
        deliveryFee: 0,
        isFreeDelivery: false,
        amountNeededForFreeDelivery: null,
        freeDeliveryThreshold: null,
        canHaveFreeDelivery: false,
      };
    }

    // Calculate base delivery fee
    let baseDeliveryFee = 0;
    if (store.delivery_price_mode === 'fixed') {
      baseDeliveryFee = store.fixed_delivery_price || 0;
    } else if (store.delivery_price_mode === 'by_zone' && selectedZone) {
      baseDeliveryFee = selectedZone.delivery_price || 0;
    }

    // If free delivery is not enabled at store level, return base fee
    if (!store.free_delivery_enabled) {
      return {
        deliveryFee: baseDeliveryFee,
        isFreeDelivery: false,
        amountNeededForFreeDelivery: null,
        freeDeliveryThreshold: null,
        canHaveFreeDelivery: false,
      };
    }

    // Determine the free delivery threshold based on mode
    let freeDeliveryThreshold: number | null = null;

    if (store.delivery_price_mode === 'fixed') {
      // Fixed mode: use global threshold
      freeDeliveryThreshold = store.global_free_delivery_min_amount;
    } else if (store.delivery_price_mode === 'by_zone' && selectedZone) {
      // By zone mode: check if zone is included
      if (!selectedZone.free_delivery_enabled) {
        // Zone is excluded from free delivery
        return {
          deliveryFee: baseDeliveryFee,
          isFreeDelivery: false,
          amountNeededForFreeDelivery: null,
          freeDeliveryThreshold: null,
          canHaveFreeDelivery: false,
        };
      }

      // Zone has free delivery enabled
      // Use zone-specific amount if set, otherwise use global
      freeDeliveryThreshold = selectedZone.free_delivery_min_amount ?? store.global_free_delivery_min_amount;
    }

    // If no threshold is set, can't have free delivery
    if (freeDeliveryThreshold === null || freeDeliveryThreshold <= 0) {
      return {
        deliveryFee: baseDeliveryFee,
        isFreeDelivery: false,
        amountNeededForFreeDelivery: null,
        freeDeliveryThreshold: null,
        canHaveFreeDelivery: false,
      };
    }

    // Check if cart total qualifies for free delivery
    const isFreeDelivery = cartTotal >= freeDeliveryThreshold;
    const amountNeededForFreeDelivery = isFreeDelivery 
      ? null 
      : freeDeliveryThreshold - cartTotal;

    return {
      deliveryFee: isFreeDelivery ? 0 : baseDeliveryFee,
      isFreeDelivery,
      amountNeededForFreeDelivery,
      freeDeliveryThreshold,
      canHaveFreeDelivery: true,
    };
  }, [store, selectedZone, cartTotal]);
};
