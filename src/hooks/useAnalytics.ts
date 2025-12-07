import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useStore } from '@/contexts/StoreContext';
import {
  AnalyticsFilters,
  SalesMetrics,
  ChartDataPoint,
  TopProduct,
  CustomerStats,
  MetricsComparison,
  calculatePercentageChange,
  getPreviousPeriod,
} from '@/lib/analytics';
import { format, eachDayOfInterval } from 'date-fns';
import { useMemo } from 'react';

export function useAnalytics(filters: AnalyticsFilters) {
  const { store } = useStore();
  const { dateRange, status, paymentMethod } = filters;

  // Calculate previous period
  const previousDateRange = useMemo(() => getPreviousPeriod(dateRange), [dateRange]);

  // Sales metrics
  const { data: salesMetrics, isLoading: loadingMetrics } = useQuery({
    queryKey: ['analytics-metrics', store?.id, dateRange, status, paymentMethod],
    queryFn: async (): Promise<SalesMetrics> => {
      if (!store?.id) throw new Error('Store ID required');

      let query = supabase
        .from('orders')
        .select(`
          total_amount, 
          status,
          order_items (
            quantity
          )
        `)
        .eq('store_id', store.id)
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString());

      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      if (paymentMethod && paymentMethod !== 'all') {
        query = query.eq('payment_method', paymentMethod);
      }

      const { data: orders, error } = await query;

      if (error) throw error;

      const totalRevenue = orders?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;
      const totalOrders = orders?.length || 0;
      const completedOrders = orders?.filter((o) => o.status === 'delivered').length || 0;
      const pendingOrders = orders?.filter((o) => o.status === 'pending').length || 0;
      const cancelledOrders = orders?.filter((o) => o.status === 'cancelled').length || 0;

      // Calculate total products sold
      const totalProductsSold = orders?.reduce((sum, order) => {
        const items = (order as { order_items?: Array<{ quantity: number }> }).order_items || [];
        return sum + items.reduce((itemSum: number, item) => itemSum + item.quantity, 0);
      }, 0) || 0;

      // Calculate average daily sales
      const daysDiff = Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const averageDailySales = daysDiff > 0 ? totalRevenue / daysDiff : 0;

      return {
        totalRevenue,
        totalOrders,
        averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
        completedOrders,
        pendingOrders,
        cancelledOrders,
        totalProductsSold,
        averageDailySales,
      };
    },
    enabled: !!store?.id,
  });

  // Chart data (daily revenue)
  const { data: chartData, isLoading: loadingChart } = useQuery({
    queryKey: ['analytics-chart', store?.id, dateRange, status, paymentMethod],
    queryFn: async (): Promise<ChartDataPoint[]> => {
      if (!store?.id) throw new Error('Store ID required');

      let query = supabase
        .from('orders')
        .select('total_amount, created_at, status, payment_method')
        .eq('store_id', store.id)
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString())
        .order('created_at', { ascending: true });

      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      if (paymentMethod && paymentMethod !== 'all') {
        query = query.eq('payment_method', paymentMethod);
      }

      const { data: orders, error } = await query;

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
        if (!order.created_at) return;
        const dateKey = format(new Date(order.created_at), 'yyyy-MM-dd');
        const existing = dailyData.get(dateKey) || { revenue: 0, orders: 0 };

        // Only count delivered orders in revenue
        const revenue = order.status === 'delivered' ? Number(order.total_amount) : 0;

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
    queryKey: ['analytics-top-products', store?.id, dateRange, status, paymentMethod],
    queryFn: async (): Promise<TopProduct[]> => {
      if (!store?.id) throw new Error('Store ID required');

      let query = supabase
        .from('orders')
        .select(`
          id,
          status,
          payment_method,
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
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString());

      // Only filter by delivered if no status filter is set or if status is 'delivered'
      if (!status || status === 'all' || status === 'delivered') {
        query = query.eq('status', 'delivered');
      } else {
        query = query.eq('status', status);
      }

      if (paymentMethod && paymentMethod !== 'all') {
        query = query.eq('payment_method', paymentMethod);
      }

      const { data: orders, error } = await query;

      if (error) throw error;

      // Aggregate product sales
      const productMap = new Map<string, { name: string; quantity: number; revenue: number; image_url: string | null }>();

      orders?.forEach((order) => {
        const ord = order as {
          order_items?: Array<{
            menu_item_id: string;
            item_name: string;
            quantity: number;
            price_at_time: number;
            menu_items?: { image_url?: string | null };
          }>;
        };
        const items = ord.order_items || [];
        items?.forEach((item) => {
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
    queryKey: ['analytics-customers', store?.id, dateRange, status, paymentMethod],
    queryFn: async (): Promise<CustomerStats> => {
      if (!store?.id) throw new Error('Store ID required');

      // Get unique customers from orders (customers table has no store_id)
      // All time orders for this store
      const { data: allOrders, error: allError } = await supabase
        .from('orders')
        .select('customer_email, created_at')
        .eq('store_id', store.id);

      if (allError) throw allError;

      // Get unique customer emails
      const uniqueCustomers = new Set(allOrders?.map(o => o.customer_email) || []);
      const totalCustomers = uniqueCustomers.size;

      // Get customers from the period
      const customersInPeriod = new Set(
        allOrders?.filter(o => {
          const orderDate = new Date(o.created_at);
          return orderDate >= dateRange.from && orderDate <= dateRange.to;
        }).map(o => o.customer_email) || []
      );

      // Find customers whose first order was in this period
      const firstOrderMap = new Map<string, Date>();
      allOrders?.forEach(order => {
        const email = order.customer_email;
        const orderDate = new Date(order.created_at);
        if (!firstOrderMap.has(email) || orderDate < firstOrderMap.get(email)!) {
          firstOrderMap.set(email, orderDate);
        }
      });

      const newCustomers = Array.from(customersInPeriod).filter(email => {
        const firstOrder = firstOrderMap.get(email);
        return firstOrder && firstOrder >= dateRange.from && firstOrder <= dateRange.to;
      }).length;

      return {
        totalCustomers,
        newCustomers,
        returningCustomers: totalCustomers - newCustomers,
      };
    },
    enabled: !!store?.id,
  });

  // Orders list
  const { data: orders, isLoading: loadingOrders } = useQuery({
    queryKey: ['analytics-orders', store?.id, dateRange, status, paymentMethod],
    queryFn: async () => {
      if (!store?.id) throw new Error('Store ID required');

      let query = supabase
        .from('orders')
        .select('*')
        .eq('store_id', store.id)
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString())
        .order('created_at', { ascending: false });

      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      if (paymentMethod && paymentMethod !== 'all') {
        query = query.eq('payment_method', paymentMethod);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!store?.id,
  });

  // Previous period metrics for comparison
  const { data: previousMetrics } = useQuery({
    queryKey: ['analytics-previous-metrics', store?.id, previousDateRange, status, paymentMethod],
    queryFn: async (): Promise<SalesMetrics> => {
      if (!store?.id) throw new Error('Store ID required');

      let query = supabase
        .from('orders')
        .select(`
          total_amount, 
          status,
          order_items (
            quantity
          )
        `)
        .eq('store_id', store.id)
        .gte('created_at', previousDateRange.from.toISOString())
        .lte('created_at', previousDateRange.to.toISOString());

      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      if (paymentMethod && paymentMethod !== 'all') {
        query = query.eq('payment_method', paymentMethod);
      }

      const { data: orders, error } = await query;

      if (error) throw error;

      const totalRevenue = orders?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;
      const totalOrders = orders?.length || 0;
      const completedOrders = orders?.filter((o) => o.status === 'delivered').length || 0;
      const pendingOrders = orders?.filter((o) => o.status === 'pending').length || 0;
      const cancelledOrders = orders?.filter((o) => o.status === 'cancelled').length || 0;

      const totalProductsSold = orders?.reduce((sum, order) => {
        const items = (order as { order_items?: Array<{ quantity: number }> }).order_items || [];
        return sum + items.reduce((itemSum: number, item) => itemSum + item.quantity, 0);
      }, 0) || 0;

      const daysDiff = Math.ceil((previousDateRange.to.getTime() - previousDateRange.from.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const averageDailySales = daysDiff > 0 ? totalRevenue / daysDiff : 0;

      return {
        totalRevenue,
        totalOrders,
        averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
        completedOrders,
        pendingOrders,
        cancelledOrders,
        totalProductsSold,
        averageDailySales,
      };
    },
    enabled: !!store?.id && !!salesMetrics,
  });

  // Calculate comparison metrics
  const comparison = useMemo((): MetricsComparison | null => {
    if (!salesMetrics || !previousMetrics) return null;
    
    return {
      revenue: calculatePercentageChange(salesMetrics.totalRevenue, previousMetrics.totalRevenue),
      orders: calculatePercentageChange(salesMetrics.totalOrders, previousMetrics.totalOrders),
      averageOrderValue: calculatePercentageChange(salesMetrics.averageOrderValue, previousMetrics.averageOrderValue),
      productsSold: calculatePercentageChange(salesMetrics.totalProductsSold || 0, previousMetrics.totalProductsSold || 0),
      averageDailySales: calculatePercentageChange(salesMetrics.averageDailySales || 0, previousMetrics.averageDailySales || 0),
    };
  }, [salesMetrics, previousMetrics]);

  return {
    salesMetrics,
    chartData,
    topProducts,
    customerStats,
    orders,
    comparison,
    isLoading: loadingMetrics || loadingChart || loadingProducts || loadingCustomers || loadingOrders,
  };
}
