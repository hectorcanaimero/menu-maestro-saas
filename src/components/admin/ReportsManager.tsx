import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/contexts/StoreContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import { BarChart3, DollarSign, ShoppingCart, Package, TrendingUp, Calendar as CalendarIcon } from "lucide-react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { es } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";

interface OrderItem {
  item_name: string;
  quantity: number;
  price_at_time: number;
}

interface Order {
  id: string;
  total_amount: number;
  created_at: string;
  customer_name: string;
  status: string;
  order_items: OrderItem[];
}

interface TopProduct {
  name: string;
  quantity: number;
  revenue: number;
}

interface DailySales {
  date: string;
  sales: number;
  orders: number;
}

const ReportsManager = () => {
  const { store } = useStore();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [period, setPeriod] = useState<string>("today");
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  
  // Stats
  const [totalSales, setTotalSales] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [averageDailySales, setAverageDailySales] = useState(0);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [dailySalesData, setDailySalesData] = useState<DailySales[]>([]);

  useEffect(() => {
    if (store?.id) {
      applyPeriodFilter();
    }
  }, [store?.id, period]);

  const applyPeriodFilter = () => {
    const now = new Date();
    let from: Date;
    let to: Date = endOfDay(now);

    switch (period) {
      case "today":
        from = startOfDay(now);
        break;
      case "7days":
        from = startOfDay(subDays(now, 6));
        break;
      case "30days":
        from = startOfDay(subDays(now, 29));
        break;
      case "custom":
        if (!dateFrom || !dateTo) {
          toast.error("Selecciona un rango de fechas");
          return;
        }
        from = startOfDay(dateFrom);
        to = endOfDay(dateTo);
        break;
      default:
        from = startOfDay(now);
    }

    fetchReports(from, to);
  };

  const fetchReports = async (from: Date, to: Date) => {
    if (!store?.id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          order_items (
            item_name,
            quantity,
            price_at_time
          )
        `)
        .eq("store_id", store.id)
        .gte("created_at", from.toISOString())
        .lte("created_at", to.toISOString())
        .order("created_at", { ascending: true });

      if (error) throw error;

      const ordersData = data || [];
      setOrders(ordersData);
      calculateStats(ordersData, from, to);
    } catch (error) {
      console.error("Error fetching reports:", error);
      toast.error("Error al cargar informes");
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (ordersData: Order[], from: Date, to: Date) => {
    // Total sales
    const sales = ordersData.reduce((sum, order) => sum + Number(order.total_amount), 0);
    setTotalSales(sales);

    // Total orders
    setTotalOrders(ordersData.length);

    // Total products sold
    const products = ordersData.reduce((sum, order) => {
      return sum + order.order_items.reduce((itemSum, item) => itemSum + item.quantity, 0);
    }, 0);
    setTotalProducts(products);

    // Average daily sales
    const daysDiff = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    setAverageDailySales(sales / daysDiff);

    // Top products
    const productMap = new Map<string, { quantity: number; revenue: number }>();
    ordersData.forEach(order => {
      order.order_items.forEach(item => {
        const current = productMap.get(item.item_name) || { quantity: 0, revenue: 0 };
        productMap.set(item.item_name, {
          quantity: current.quantity + item.quantity,
          revenue: current.revenue + (item.price_at_time * item.quantity)
        });
      });
    });

    const topProds = Array.from(productMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 3);
    setTopProducts(topProds);

    // Daily sales data for chart
    const salesByDate = new Map<string, { sales: number; orders: number }>();
    ordersData.forEach(order => {
      const dateKey = format(new Date(order.created_at), "dd/MM", { locale: es });
      const current = salesByDate.get(dateKey) || { sales: 0, orders: 0 };
      salesByDate.set(dateKey, {
        sales: current.sales + Number(order.total_amount),
        orders: current.orders + 1
      });
    });

    const chartData = Array.from(salesByDate.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => {
        const [dayA, monthA] = a.date.split("/").map(Number);
        const [dayB, monthB] = b.date.split("/").map(Number);
        return monthA === monthB ? dayA - dayB : monthA - monthB;
      });
    setDailySalesData(chartData);
  };

  if (loading && orders.length === 0) {
    return <div className="text-center py-8">Cargando informes...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Informes de Ventas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Hoy</SelectItem>
                <SelectItem value="7days">Últimos 7 días</SelectItem>
                <SelectItem value="30days">Últimos 30 días</SelectItem>
                <SelectItem value="custom">Rango personalizado</SelectItem>
              </SelectContent>
            </Select>

            {period === "custom" && (
              <>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "justify-start text-left font-normal",
                        !dateFrom && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateFrom ? format(dateFrom, "dd/MM/yyyy") : <span>Desde</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateFrom}
                      onSelect={setDateFrom}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "justify-start text-left font-normal",
                        !dateTo && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateTo ? format(dateTo, "dd/MM/yyyy") : <span>Hasta</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateTo}
                      onSelect={setDateTo}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>

                <Button onClick={applyPeriodFilter}>
                  Filtrar
                </Button>
              </>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ventas Totales</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$ {totalSales.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">En este período</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Pedidos</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalOrders}</div>
                <p className="text-xs text-muted-foreground">En este período</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Productos Vendidos</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalProducts}</div>
                <p className="text-xs text-muted-foreground">Unidades totales</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Promedio Diario</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$ {averageDailySales.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">Ventas por día</p>
              </CardContent>
            </Card>
          </div>

          {/* Sales Chart */}
          {dailySalesData.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-base">Ventas en el Período</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dailySalesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number) => [`$${value.toFixed(2)}`, "Ventas"]}
                    />
                    <Legend 
                      formatter={() => "Ventas"}
                    />
                    <Bar dataKey="sales" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Orders Chart */}
          {dailySalesData.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-base">Pedidos en el Período</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dailySalesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number) => [value, "Pedidos"]}
                    />
                    <Legend 
                      formatter={() => "Pedidos"}
                    />
                    <Bar dataKey="orders" fill="hsl(var(--chart-2))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Top Products */}
          {topProducts.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-base">Top 3 Productos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topProducts.map((product, index) => (
                    <div key={product.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {product.quantity} vendidos
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">$ {product.revenue.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">en ingresos</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Orders List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Pedidos en el Período ({orders.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {orders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay pedidos en este período
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="space-y-1">
                        <p className="font-medium">#{order.id.slice(0, 8)}</p>
                        <p className="text-sm text-muted-foreground">
                          {order.customer_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(order.created_at), "dd/MM/yyyy HH:mm", { locale: es })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">$ {Number(order.total_amount).toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">
                          {order.order_items.reduce((sum, item) => sum + item.quantity, 0)} productos
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsManager;