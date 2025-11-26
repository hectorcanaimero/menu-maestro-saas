import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useStore } from '@/contexts/StoreContext';
import {
  DateRangeValue,
  SalesMetrics,
  ChartDataPoint,
  TopProduct,
  CustomerStats,
} from '@/lib/analytics';
import { format, eachDayOfInterval } from 'date-fns';

export function useAnalytics(dateRange: DateRangeValue) {
  const { store } = useStore();

  // Sales metrics
  const { data: salesMetrics, isLoading: loadingMetrics } = useQuery({
    queryKey: ['analytics-metrics', store?.id, dateRange],
    queryFn: async (): Promise<SalesMetrics> => {
      if (!store?.id) throw new Error('Store ID required');

      const { data: orders, error } = await supabase
        .from('orders')
        .select('total_amount, status')
        .eq('store_id', store.id)
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString());

      if (error) throw error;

      const totalRevenue = orders?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;
      const totalOrders = orders?.length || 0;
      const completedOrders = orders?.filter((o) => o.status === 'completed').length || 0;
      const pendingOrders = orders?.filter((o) => o.status === 'pending').length || 0;
      const cancelledOrders = orders?.filter((o) => o.status === 'cancelled').length || 0;

      return {
        totalRevenue,
        totalOrders,
        averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
        completedOrders,
        pendingOrders,
        cancelledOrders,
      };
    },
    enabled: !!store?.id,
  });

  // Chart data (daily revenue)
  const { data: chartData, isLoading: loadingChart } = useQuery({
    queryKey: ['analytics-chart', store?.id, dateRange],
    queryFn: async (): Promise<ChartDataPoint[]> => {
      if (!store?.id) throw new Error('Store ID required');

      const { data: orders, error } = await supabase
        .from('orders')
        .select('total_amount, created_at, status')
        .eq('store_id', store.id)
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Create a map of daily totals
      const dailyData = new Map<string, { revenue: number; orders: number }>();

      // Initialize all days in range with 0
      const days = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
      days.forEach((day) => {
        const dateKey = format(day, 'yyyy-MM-dd');
        dailyData.set(dateKey, { revenue: 0, orders: 0 });
      });

      // Aggregate order data
      orders?.forEach((order) => {
        const dateKey = format(new Date(order.created_at), 'yyyy-MM-dd');
        const existing = dailyData.get(dateKey) || { revenue: 0, orders: 0 };

        // Only count completed orders in revenue
        const revenue = order.status === 'completed' ? Number(order.total_amount) : 0;

        dailyData.set(dateKey, {
          revenue: existing.revenue + revenue,
          orders: existing.orders + 1,
        });
      });

      // Convert to array
      return Array.from(dailyData.entries()).map(([date, data]) => ({
        date: format(new Date(date), 'MMM dd'),
        revenue: data.revenue,
        orders: data.orders,
      }));
    },
    enabled: !!store?.id,
  });

  // Top selling products
  const { data: topProducts, isLoading: loadingProducts } = useQuery({
    queryKey: ['analytics-top-products', store?.id, dateRange],
    queryFn: async (): Promise<TopProduct[]> => {
      if (!store?.id) throw new Error('Store ID required');

      const { data: orders, error } = await supabase
        .from('orders')
        .select(`
          id,
          status,
          order_items (
            id,
            item_name,
            quantity,
            price_at_time,
            menu_item_id,
            menu_items (
              image_url
            )
          )
        `)
        .eq('store_id', store.id)
        .eq('status', 'completed')
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString());

      if (error) throw error;

      // Aggregate product sales
      const productMap = new Map<string, { name: string; quantity: number; revenue: number; image_url: string | null }>();

      orders?.forEach((order: any) => {
        const items = order.order_items || [];
        items?.forEach((item: any) => {
          const existing = productMap.get(item.menu_item_id) || {
            name: item.item_name,
            quantity: 0,
            revenue: 0,
            image_url: item.menu_items?.image_url || null,
          };

          productMap.set(item.menu_item_id, {
            name: item.item_name,
            quantity: existing.quantity + item.quantity,
            revenue: existing.revenue + (item.price_at_time * item.quantity),
            image_url: item.menu_items?.image_url || null,
          });
        });
      });

      // Convert to array and sort by quantity
      return Array.from(productMap.entries())
        .map(([id, data]) => ({ id, ...data }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 10);
    },
    enabled: !!store?.id,
  });

  // Customer statistics
  const { data: customerStats, isLoading: loadingCustomers } = useQuery({
    queryKey: ['analytics-customers', store?.id, dateRange],
    queryFn: async (): Promise<CustomerStats> => {
      if (!store?.id) throw new Error('Store ID required');

      const { data: customers, error } = await supabase
        .from('customers')
        .select('id, created_at');

      if (error) throw error;

      const totalCustomers = customers?.length || 0;
      const newCustomers = customers?.filter((c) => {
        const createdAt = new Date(c.created_at);
        return createdAt >= dateRange.from && createdAt <= dateRange.to;
      }).length || 0;

      return {
        totalCustomers,
        newCustomers,
        returningCustomers: totalCustomers - newCustomers,
      };
    },
    enabled: !!store?.id,
  });

  return {
    salesMetrics,
    chartData,
    topProducts,
    customerStats,
    isLoading: loadingMetrics || loadingChart || loadingProducts || loadingCustomers,
  };
}
