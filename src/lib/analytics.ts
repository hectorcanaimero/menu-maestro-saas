import { format, subDays, startOfDay, endOfDay } from 'date-fns';

export type DateRange = '7d' | '30d' | '90d' | 'custom';

export interface DateRangeValue {
  from: Date;
  to: Date;
}

export interface AnalyticsFilters {
  dateRange: DateRangeValue;
  status?: string;
  paymentMethod?: string;
}

export const ORDER_STATUSES = [
  { value: 'all', label: 'Todos los estados' },
  { value: 'pending', label: 'Pendiente' },
  { value: 'confirmed', label: 'Confirmado' },
  { value: 'in_process', label: 'En Proceso' },
  { value: 'ready', label: 'Listo' },
  { value: 'in_delivery', label: 'En Delivery' },
  { value: 'completed', label: 'Completado' },
  { value: 'cancelled', label: 'Cancelado' },
];

export interface SalesMetrics {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  completedOrders: number;
  pendingOrders: number;
  cancelledOrders: number;
  totalProductsSold?: number;
  averageDailySales?: number;
}

export interface MetricsComparison {
  revenue: number;
  orders: number;
  averageOrderValue: number;
  productsSold: number;
  averageDailySales: number;
}

export interface ChartDataPoint {
  date: string;
  revenue: number;
  orders: number;
}

export interface TopProduct {
  id: string;
  name: string;
  quantity: number;
  revenue: number;
  image_url: string | null;
}

export interface CustomerStats {
  totalCustomers: number;
  newCustomers: number;
  returningCustomers: number;
}

export function getDateRangeFromPreset(preset: DateRange): DateRangeValue {
  const today = new Date();
  const to = endOfDay(today);

  switch (preset) {
    case '7d':
      return { from: startOfDay(subDays(today, 6)), to };
    case '30d':
      return { from: startOfDay(subDays(today, 29)), to };
    case '90d':
      return { from: startOfDay(subDays(today, 89)), to };
    default:
      return { from: startOfDay(subDays(today, 29)), to };
  }
}

export function getPreviousPeriod(dateRange: DateRangeValue): DateRangeValue {
  const duration = dateRange.to.getTime() - dateRange.from.getTime();
  const previousTo = new Date(dateRange.from.getTime() - 1); // One day before current start
  const previousFrom = new Date(previousTo.getTime() - duration);
  return { 
    from: startOfDay(previousFrom), 
    to: endOfDay(previousTo) 
  };
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

// Get currency symbol without formatting
export function getCurrencySymbol(currency: string = 'USD'): string {
  const symbols: Record<string, string> = {
    USD: '$',
    VES: 'Bs',
    BRL: 'R$',
    EUR: '€',
    COP: '$',
    ARS: '$',
    MXN: '$',
  };
  return symbols[currency] || '$';
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('es-ES').format(num);
}

export function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

export function exportToCSV(data: any[], filename: string) {
  if (!data || data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map((row) =>
      headers.map((header) => {
        const value = row[header];
        // Escape commas and quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
