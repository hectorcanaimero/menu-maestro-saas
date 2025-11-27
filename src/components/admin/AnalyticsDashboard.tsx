import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingBag,
  Users,
  Package,
  Download,
  Calendar,
  Filter,
  X,
  ChevronDown,
  FileText,
  ShoppingCart
} from 'lucide-react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { usePaymentMethods } from '@/hooks/usePaymentMethods';
import { useStore } from '@/contexts/StoreContext';
import { AnalyticsCharts } from './AnalyticsCharts';
import {
  DateRange,
  getDateRangeFromPreset,
  formatCurrency,
  formatNumber,
  exportToCSV,
  ORDER_STATUSES,
  AnalyticsFilters,
} from '@/lib/analytics';
import {
  exportToPDF,
  prepareOrdersForExport,
  prepareSalesSummaryForExport,
  prepareTopProductsForExport
} from '@/lib/exportUtils';
import { H2, H4, Body, Caption } from '@/components/ui/typography';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export function AnalyticsDashboard() {
  const { store } = useStore();
  const [dateRangePreset, setDateRangePreset] = useState<DateRange>('30d');
  const [customDateRange, setCustomDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('all');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [ordersExpanded, setOrdersExpanded] = useState(false);

  const { data: paymentMethods } = usePaymentMethods();

  const dateRange = dateRangePreset === 'custom' && customDateRange.from && customDateRange.to
    ? { from: customDateRange.from, to: customDateRange.to }
    : getDateRangeFromPreset(dateRangePreset);

  const filters: AnalyticsFilters = {
    dateRange,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    paymentMethod: paymentMethodFilter !== 'all' ? paymentMethodFilter : undefined,
  };

  const { salesMetrics, chartData, topProducts, customerStats, orders, comparison, isLoading } = useAnalytics(filters);

  const activeFiltersCount = 
    (statusFilter !== 'all' ? 1 : 0) + 
    (paymentMethodFilter !== 'all' ? 1 : 0) +
    (dateRangePreset === 'custom' ? 1 : 0);

  const clearFilters = () => {
    setDateRangePreset('30d');
    setCustomDateRange({});
    setStatusFilter('all');
    setPaymentMethodFilter('all');
  };

  const handleExportSales = () => {
    if (!chartData) return;
    exportToCSV(chartData, 'sales_report');
  };

  const handleExportProducts = () => {
    if (!topProducts) return;
    const exportData = prepareTopProductsForExport(topProducts);
    exportToCSV(exportData, 'top-productos');
  };

  const handleExportOrdersCSV = () => {
    if (!orders) return;
    const exportData = prepareOrdersForExport(orders);
    exportToCSV(exportData, 'reporte-ordenes');
  };

  const handleExportOrdersPDF = () => {
    if (!orders) return;
    const exportData = prepareOrdersForExport(orders);
    exportToPDF({
      title: 'Reporte de Órdenes',
      subtitle: `Período: ${dateRangePreset === '7d' ? 'Últimos 7 días' : dateRangePreset === '30d' ? 'Últimos 30 días' : dateRangePreset === '90d' ? 'Últimos 90 días' : 'Personalizado'}`,
      filename: 'reporte-ordenes',
      columns: [
        { header: 'Número', dataKey: 'Número' },
        { header: 'Fecha', dataKey: 'Fecha', width: 35 },
        { header: 'Cliente', dataKey: 'Cliente' },
        { header: 'Total', dataKey: 'Total' },
        { header: 'Estado', dataKey: 'Estado' },
      ],
      data: exportData,
      orientation: 'landscape',
    });
  };

  const handleExportSummaryCSV = () => {
    if (!salesMetrics) return;
    const exportData = prepareSalesSummaryForExport({
      totalSales: salesMetrics.totalRevenue,
      totalOrders: salesMetrics.totalOrders,
      totalProducts: salesMetrics.totalProductsSold || 0,
      averageDailySales: salesMetrics.averageDailySales || 0,
      period: dateRangePreset === '7d' ? 'Últimos 7 días' : dateRangePreset === '30d' ? 'Últimos 30 días' : dateRangePreset === '90d' ? 'Últimos 90 días' : 'Personalizado',
    });
    exportToCSV(exportData, 'resumen-ventas');
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "outline",
      confirmed: "secondary",
      preparing: "default",
      ready: "default",
      delivered: "secondary",
      cancelled: "destructive",
    };
    return variants[status] || "default";
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: "Pendiente",
      confirmed: "Confirmado",
      preparing: "Preparando",
      ready: "Listo",
      delivered: "Entregado",
      cancelled: "Cancelado",
    };
    return labels[status] || status;
  };

  const MetricCard = ({
    title,
    value,
    icon: Icon,
    trend,
    subtitle
  }: {
    title: string;
    value: string;
    icon: any;
    trend?: number;
    subtitle?: string;
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <Caption className="text-muted-foreground font-medium">{title}</Caption>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && (
          <Caption className="text-muted-foreground mt-1">{subtitle}</Caption>
        )}
        {trend !== undefined && (
          <div className="flex items-center gap-1 mt-2">
            {trend >= 0 ? (
              <TrendingUp className="h-3 w-3 text-green-500" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-500" />
            )}
            <Caption className={trend >= 0 ? 'text-green-500' : 'text-red-500'}>
              {Math.abs(trend).toFixed(1)}%
            </Caption>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <H2>Análisis y Reportes</H2>
          <Body size="small" className="text-muted-foreground">
            Resumen completo del rendimiento de tu tienda
          </Body>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportSummaryCSV}>
            <Download className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Resumen CSV</span>
            <span className="sm:hidden">CSV</span>
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportOrdersCSV}>
            <FileText className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Órdenes CSV</span>
            <span className="sm:hidden">CSV</span>
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportOrdersPDF}>
            <FileText className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Órdenes PDF</span>
            <span className="sm:hidden">PDF</span>
          </Button>
        </div>
      </div>

      {/* Filters Section */}
      <Card>
        <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-4 h-auto">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <span className="font-medium">Filtros</span>
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {activeFiltersCount}
                  </Badge>
                )}
              </div>
              <ChevronDown className={cn(
                "h-4 w-4 transition-transform",
                filtersOpen && "transform rotate-180"
              )} />
            </Button>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <CardContent className="pt-0 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Date Range */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Período</label>
                  <Select value={dateRangePreset} onValueChange={(v) => setDateRangePreset(v as DateRange)}>
                    <SelectTrigger>
                      <Calendar className="h-4 w-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7d">Últimos 7 días</SelectItem>
                      <SelectItem value="30d">Últimos 30 días</SelectItem>
                      <SelectItem value="90d">Últimos 90 días</SelectItem>
                      <SelectItem value="custom">Personalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Custom Date Range Picker */}
                {dateRangePreset === 'custom' && (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Fecha inicio</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-left font-normal">
                            <Calendar className="h-4 w-4 mr-2" />
                            {customDateRange.from ? format(customDateRange.from, 'PPP') : 'Seleccionar'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={customDateRange.from}
                            onSelect={(date) => setCustomDateRange(prev => ({ ...prev, from: date }))}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Fecha fin</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-left font-normal">
                            <Calendar className="h-4 w-4 mr-2" />
                            {customDateRange.to ? format(customDateRange.to, 'PPP') : 'Seleccionar'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={customDateRange.to}
                            onSelect={(date) => setCustomDateRange(prev => ({ ...prev, to: date }))}
                            disabled={(date) => customDateRange.from ? date < customDateRange.from : false}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </>
                )}

                {/* Order Status */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Estado</label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ORDER_STATUSES.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Payment Method */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Método de Pago</label>
                  <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los métodos</SelectItem>
                      {paymentMethods?.map((method) => (
                        <SelectItem key={method.id} value={method.name}>
                          {method.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Clear Filters */}
              {activeFiltersCount > 0 && (
                <div className="flex justify-end pt-2">
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <X className="h-4 w-4 mr-2" />
                    Limpiar filtros
                  </Button>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Metrics Cards */}
      {comparison && (
        <p className="text-sm text-muted-foreground">
          Comparado con el período anterior
        </p>
      )}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <MetricCard
          title="Ingresos Totales"
          value={formatCurrency(salesMetrics?.totalRevenue || 0, store?.currency)}
          icon={DollarSign}
          trend={comparison?.revenue}
          subtitle={`${salesMetrics?.completedOrders || 0} completados`}
        />
        <MetricCard
          title="Total de Pedidos"
          value={formatNumber(salesMetrics?.totalOrders || 0)}
          icon={ShoppingBag}
          trend={comparison?.orders}
          subtitle={`${salesMetrics?.pendingOrders || 0} pendientes`}
        />
        <MetricCard
          title="Valor Promedio"
          value={formatCurrency(salesMetrics?.averageOrderValue || 0, store?.currency)}
          icon={Package}
          trend={comparison?.averageOrderValue}
          subtitle="Por pedido"
        />
        <MetricCard
          title="Clientes"
          value={formatNumber(customerStats?.totalCustomers || 0)}
          icon={Users}
          subtitle={`${customerStats?.newCustomers || 0} nuevos`}
        />
        <MetricCard
          title="Productos Vendidos"
          value={formatNumber(salesMetrics?.totalProductsSold || 0)}
          icon={ShoppingCart}
          trend={comparison?.productsSold}
          subtitle="Unidades totales"
        />
        <MetricCard
          title="Promedio Diario"
          value={formatCurrency(salesMetrics?.averageDailySales || 0, store?.currency)}
          icon={TrendingUp}
          trend={comparison?.averageDailySales}
          subtitle="Ventas por día"
        />
      </div>

      {/* Charts */}
      {chartData && <AnalyticsCharts data={chartData} />}

      {/* Top Products */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Productos Más Vendidos</CardTitle>
            <Caption className="text-muted-foreground mt-1">
              Top 10 productos del período seleccionado
            </Caption>
          </div>
          <Button variant="outline" size="sm" onClick={handleExportProducts}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </CardHeader>
        <CardContent>
          {topProducts && topProducts.length > 0 ? (
            <div className="space-y-4">
              {topProducts.map((product, index) => (
                <div
                  key={product.id}
                  className="flex items-center gap-4 pb-4 border-b last:border-0"
                >
                  <div className="flex-shrink-0 w-8 text-center">
                    <Badge variant={index < 3 ? 'default' : 'secondary'}>
                      {index + 1}
                    </Badge>
                  </div>

                  {product.image_url && (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                  )}

                  <div className="flex-1 min-w-0">
                    <H4 className="text-sm truncate">{product.name}</H4>
                    <Caption className="text-muted-foreground">
                      {product.quantity} unidades vendidas
                    </Caption>
                  </div>

                  <div className="text-right">
                    <div className="font-semibold text-sm">
                      {formatCurrency(product.revenue)}
                    </div>
                    <Caption className="text-muted-foreground">ingresos</Caption>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Body className="text-center text-muted-foreground py-8">
              No hay datos de ventas para el período seleccionado
            </Body>
          )}
        </CardContent>
      </Card>

      {/* Order Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Pedidos Completados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {salesMetrics?.completedOrders || 0}
            </div>
            <Caption className="text-muted-foreground">
              {salesMetrics?.totalOrders
                ? ((salesMetrics.completedOrders / salesMetrics.totalOrders) * 100).toFixed(1)
                : 0}% del total
            </Caption>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Pedidos Pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {salesMetrics?.pendingOrders || 0}
            </div>
            <Caption className="text-muted-foreground">
              {salesMetrics?.totalOrders
                ? ((salesMetrics.pendingOrders / salesMetrics.totalOrders) * 100).toFixed(1)
                : 0}% del total
            </Caption>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Pedidos Cancelados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {salesMetrics?.cancelledOrders || 0}
            </div>
            <Caption className="text-muted-foreground">
              {salesMetrics?.totalOrders
                ? ((salesMetrics.cancelledOrders / salesMetrics.totalOrders) * 100).toFixed(1)
                : 0}% del total
            </Caption>
          </CardContent>
        </Card>
      </div>

      {/* Orders List */}
      <Card>
        <Collapsible open={ordersExpanded} onOpenChange={setOrdersExpanded}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-4 h-auto">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4" />
                <span className="font-medium">Lista de Pedidos del Período</span>
                {orders && orders.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {orders.length}
                  </Badge>
                )}
              </div>
              <ChevronDown className={cn(
                "h-4 w-4 transition-transform",
                ordersExpanded && "transform rotate-180"
              )} />
            </Button>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <CardContent className="pt-0">
              {orders && orders.length > 0 ? (
                <>
                  <div className="flex justify-end gap-2 mb-4">
                    <Button variant="outline" size="sm" onClick={handleExportOrdersCSV}>
                      <Download className="h-4 w-4 mr-2" />
                      CSV
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleExportOrdersPDF}>
                      <FileText className="h-4 w-4 mr-2" />
                      PDF
                    </Button>
                  </div>

                  {/* Mobile View */}
                  <div className="block md:hidden space-y-3">
                    {orders.map((order) => (
                      <Card key={order.id}>
                        <CardContent className="p-4">
                          <div className="space-y-2">
                            <div className="flex justify-between items-start">
                              <div>
                                <Body className="font-medium">#{order.id.slice(0, 8)}</Body>
                                <Caption className="text-muted-foreground">
                                  {format(new Date(order.created_at), 'dd/MM/yyyy HH:mm')}
                                </Caption>
                              </div>
                              <Badge variant={getStatusVariant(order.status)}>
                                {getStatusLabel(order.status)}
                              </Badge>
                            </div>
                            <div>
                              <Caption className="text-muted-foreground">Cliente</Caption>
                              <Body size="small">{order.customer_name}</Body>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t">
                              <Caption className="text-muted-foreground">Total</Caption>
                              <Body className="font-semibold">{formatCurrency(order.total_amount)}</Body>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Desktop View */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4">Orden</th>
                          <th className="text-left py-3 px-4">Fecha</th>
                          <th className="text-left py-3 px-4">Cliente</th>
                          <th className="text-left py-3 px-4">Estado</th>
                          <th className="text-right py-3 px-4">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((order) => (
                          <tr key={order.id} className="border-b hover:bg-muted/50">
                            <td className="py-3 px-4">
                              <Body size="small" className="font-mono">#{order.id.slice(0, 8)}</Body>
                            </td>
                            <td className="py-3 px-4">
                              <Body size="small">{format(new Date(order.created_at), 'dd/MM/yyyy HH:mm')}</Body>
                            </td>
                            <td className="py-3 px-4">
                              <Body size="small">{order.customer_name}</Body>
                            </td>
                            <td className="py-3 px-4">
                              <Badge variant={getStatusVariant(order.status)}>
                                {getStatusLabel(order.status)}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <Body size="small" className="font-semibold">{formatCurrency(order.total_amount)}</Body>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <Body className="text-center text-muted-foreground py-8">
                  No hay pedidos en este período
                </Body>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </div>
  );
}
