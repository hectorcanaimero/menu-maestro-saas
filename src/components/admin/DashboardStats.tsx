import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useStore } from '@/contexts/StoreContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCart, DollarSign, TrendingUp } from 'lucide-react';

interface Stats {
  totalOrders: number;
  totalSales: number;
  topProducts: { name: string; quantity: number }[];
}

const DashboardStats = () => {
  const { store } = useStore();
  const [userEmail, setUserEmail] = useState('');
  const [stats, setStats] = useState<Stats>({
    totalOrders: 0,
    totalSales: 0,
    topProducts: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUserEmail();
    if (store?.id) {
      fetchStats();
    }
  }, [store?.id]);

  const getUserEmail = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.user?.email) {
      setUserEmail(session.user.email);
    }
  };

  const fetchStats = async () => {
    if (!store?.id) return;

    try {
      // Get total orders and sales for this store
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('id, total_amount')
        .eq('store_id', store.id);

      if (ordersError) throw ordersError;

      const totalOrders = ordersData?.length || 0;
      const totalSales = ordersData?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;

      // Get top selling products for this store
      const orderIds = ordersData?.map((o) => o.id) || [];

      if (orderIds.length === 0) {
        setStats({ totalOrders, totalSales, topProducts: [] });
        setLoading(false);
        return;
      }

      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select('item_name, quantity')
        .in('order_id', orderIds);

      if (itemsError) throw itemsError;

      // Aggregate products by name
      const productMap = new Map<string, number>();
      itemsData?.forEach((item) => {
        const current = productMap.get(item.item_name) || 0;
        productMap.set(item.item_name, current + item.quantity);
      });

      // Convert to array and sort by quantity
      const topProducts = Array.from(productMap.entries())
        .map(([name, quantity]) => ({ name, quantity }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);

      setStats({
        totalOrders,
        totalSales,
        topProducts,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="h-20 animate-pulse bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 mb-6 sm:mb-8">
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pedidos</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
            <p className="text-xs text-muted-foreground">Pedidos registrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventas Totales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalSales.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Ingresos generados</p>
          </CardContent>
        </Card>

        <Card className="sm:col-span-2 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Productos Vendidos</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.topProducts.reduce((sum, p) => sum + p.quantity, 0)}</div>
            <p className="text-xs text-muted-foreground">Unidades totales</p>
          </CardContent>
        </Card>
      </div>

      {stats.topProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Productos Más Vendidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 sm:space-y-3">
              {stats.topProducts.map((product, index) => (
                <div key={product.name} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-primary/10 text-xs sm:text-sm font-bold text-primary flex-shrink-0">
                      {index + 1}
                    </div>
                    <span className="font-medium text-sm sm:text-base truncate">{product.name}</span>
                  </div>
                  <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap flex-shrink-0">{product.quantity} vendidos</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DashboardStats;
