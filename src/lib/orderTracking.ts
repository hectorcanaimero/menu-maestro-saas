import { addMinutes, isAfter, isBefore, setHours } from 'date-fns';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export interface OrderTrackingStep {
  status: OrderStatus;
  label: string;
  description: string;
}

export const ORDER_TRACKING_STEPS: OrderTrackingStep[] = [
  {
    status: 'pending',
    label: 'Pedido Recibido',
    description: 'Tu pedido ha sido recibido y está siendo procesado',
  },
  {
    status: 'confirmed',
    label: 'Confirmado',
    description: 'El restaurante ha confirmado tu pedido',
  },
  {
    status: 'preparing',
    label: 'En Preparación',
    description: 'Tu pedido está siendo preparado',
  },
  {
    status: 'ready',
    label: 'Listo',
    description: 'Tu pedido está listo para ser entregado',
  },
  {
    status: 'out_for_delivery',
    label: 'En Camino',
    description: 'Tu pedido está en camino',
  },
  {
    status: 'delivered',
    label: 'Entregado',
    description: 'Tu pedido ha sido entregado',
  },
];

export function getStatusLabel(status: string): string {
  const step = ORDER_TRACKING_STEPS.find((s) => s.status === status);
  return step?.label || status;
}

export function getStatusDescription(status: string): string {
  const step = ORDER_TRACKING_STEPS.find((s) => s.status === status);
  return step?.description || '';
}

export function getStatusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'delivered':
      return 'default';
    case 'cancelled':
      return 'destructive';
    case 'preparing':
    case 'out_for_delivery':
      return 'secondary';
    default:
      return 'outline';
  }
}

export function getStatusIndex(status: string): number {
  return ORDER_TRACKING_STEPS.findIndex((s) => s.status === status);
}

export function isStatusCompleted(currentStatus: string, targetStatus: string): boolean {
  const currentIndex = getStatusIndex(currentStatus);
  const targetIndex = getStatusIndex(targetStatus);
  return currentIndex >= targetIndex && currentIndex >= 0 && targetIndex >= 0;
}

export function isRushHour(date: Date = new Date()): boolean {
  const hour = date.getHours();
  // Lunch rush: 12-14, Dinner rush: 19-21
  return (hour >= 12 && hour <= 14) || (hour >= 19 && hour <= 21);
}

export function calculateEstimatedDelivery(order: {
  created_at: string;
  items: Array<{ quantity: number }>;
  order_type: string;
  status: string;
}): Date {
  const createdAt = new Date(order.created_at);
  let minutes = 0;

  // Base time depending on current status
  switch (order.status) {
    case 'pending':
    case 'confirmed':
      minutes = 35; // Confirmation + preparation
      break;
    case 'preparing':
      minutes = 25; // Preparation time remaining
      break;
    case 'ready':
      minutes = 20; // Delivery time
      break;
    case 'out_for_delivery':
      minutes = 15; // En route
      break;
    case 'delivered':
      return createdAt; // Already delivered
    default:
      minutes = 30;
  }

  // Add time based on order size (more items = more prep time)
  const itemCount = order.items?.length || 0;
  minutes += Math.min(itemCount * 3, 20); // Max 20 extra minutes

  // Add delivery time if delivery order
  if (order.order_type === 'delivery') {
    minutes += 15;
  }

  // Add rush hour delay
  if (isRushHour(createdAt)) {
    minutes += 10;
  }

  return addMinutes(createdAt, minutes);
}

export function getProgressPercentage(status: string): number {
  const currentIndex = getStatusIndex(status);
  if (currentIndex < 0) return 0;
  if (status === 'delivered') return 100;
  if (status === 'cancelled') return 0;

  const totalSteps = ORDER_TRACKING_STEPS.length - 1; // Exclude cancelled
  return Math.round((currentIndex / totalSteps) * 100);
}
