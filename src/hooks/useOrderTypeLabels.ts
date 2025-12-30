import { useStore } from '@/contexts/StoreContext';

/**
 * Hook para obtener las etiquetas personalizadas de tipos de pedido
 * Retorna las etiquetas configuradas en la tienda o valores por defecto
 */
export const useOrderTypeLabels = () => {
  const { store } = useStore();

  const getLabel = (type: 'delivery' | 'pickup' | 'digital_menu' | string | null): string => {
    if (!type) return 'N/A';

    switch (type) {
      case 'delivery':
        return (store as any)?.delivery_label || 'Delivery';
      case 'pickup':
        return (store as any)?.pickup_label || 'Pick-up';
      case 'digital_menu':
        return (store as any)?.digital_menu_label || 'Mesa';
      default:
        return type;
    }
  };

  return {
    getLabel,
    deliveryLabel: (store as any)?.delivery_label || 'Delivery',
    pickupLabel: (store as any)?.pickup_label || 'Pick-up',
    digitalMenuLabel: (store as any)?.digital_menu_label || 'Mesa',
  };
};
