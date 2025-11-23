import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingBag,
  Users,
  Package,
  Download,
  Calendar
} from 'lucide-react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { AnalyticsCharts } from './AnalyticsCharts';
import {
  DateRange,
  getDateRangeFromPreset,
  formatCurrency,
  formatNumber,
  exportToCSV,
} from '@/lib/analytics';
import { H2, H4, Body, Caption } from '@/components/ui/typography';

export function AnalyticsDashboard() {
  const [dateRangePreset, setDateRangePreset] = useState<DateRange>('30d');
  const dateRange = getDateRangeFromPreset(dateRangePreset);
  const { salesMetrics, chartData, topProducts, customerStats, isLoading } = useAnalytics(dateRange);

  const handleExportSales = () => {
    if (!chartData) return;
    exportToCSV(chartData, 'sales_report');
  };

  const handleExportProducts = () => {
    if (!topProducts) return;
    exportToCSV(
      topProducts.map((p) => ({
        Producto: p.name,
        Cantidad: p.quantity,
        Ingresos: p.revenue,
      })),
      'top_products'
    );
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
          <H2>Análisis y Estadísticas</H2>
          <Body size="small" className="text-muted-foreground">
            Resumen del rendimiento de tu tienda
          </Body>
        </div>

        <div className="flex items-center gap-3">
          {/* Date Range Selector */}
          <Select value={dateRangePreset} onValueChange={(v) => setDateRangePreset(v as DateRange)}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Últimos 7 días</SelectItem>
              <SelectItem value="30d">Últimos 30 días</SelectItem>
              <SelectItem value="90d">Últimos 90 días</SelectItem>
            </SelectContent>
          </Select>

          {/* Export Button */}
          <Button variant="outline" size="sm" onClick={handleExportSales}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Ingresos Totales"
          value={formatCurrency(salesMetrics?.totalRevenue || 0)}
          icon={DollarSign}
          subtitle={`${salesMetrics?.completedOrders || 0} pedidos completados`}
        />
        <MetricCard
          title="Total de Pedidos"
          value={formatNumber(salesMetrics?.totalOrders || 0)}
          icon={ShoppingBag}
          subtitle={`${salesMetrics?.pendingOrders || 0} pendientes`}
        />
        <MetricCard
          title="Valor Promedio"
          value={formatCurrency(salesMetrics?.averageOrderValue || 0)}
          icon={Package}
          subtitle="Por pedido"
        />
        <MetricCard
          title="Clientes"
          value={formatNumber(customerStats?.totalCustomers || 0)}
          icon={Users}
          subtitle={`${customerStats?.newCustomers || 0} nuevos`}
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
    </div>
  );
}
